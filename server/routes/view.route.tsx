import notFoundPage from "@shared/templates/not-found.html";
import { getTemplateHash } from "@shared/templates/template-hash.generated";
import { ViewTemplate } from "@shared/templates/view.template";
import { Hono } from "hono";
import { db } from "../db/client";
import { createViewService } from "../services/view.service";
import { cacheControlHeader, generateETag } from "../utils/cache";

export const viewRouter = new Hono<{ Bindings: Env }>();

const cacheControl = cacheControlHeader(600);
const PUBLIC_SLUG_REGEX = /^[a-zA-Z0-9_-]{5}$/;
const USER_SLUG_REGEX = /^[a-zA-Z0-9_-]{4}$/;
const isValidPublicSlug = (slug: string) => PUBLIC_SLUG_REGEX.test(slug);
const isValidUserSlug = (slug: string) => USER_SLUG_REGEX.test(slug);
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Handle GET /:prefix/:slug request
 * Retrieves HTML from R2 and displays it
 * URL format: /{prefix}/{slug} (e.g., /1/abc123, /E/xyz789)
 */
viewRouter.get("/:prefix{^(1[Ee]|1|7|[Ee])$}/:slug", async (c) => {
	const prefix = c.req.param("prefix").toUpperCase();
	const slug = c.req.param("slug");

	if (!isValidPublicSlug(slug)) {
		return c.html(notFoundPage, 404);
	}

	const viewService = createViewService({ env: c.env, db });

	// Check cache first
	const cache = (caches as unknown as { default: Cache }).default;
	const url = new URL(c.req.url);
	url.search = "";
	const cacheKey = new Request(url, c.req.raw);
	const cachedResponse = await cache.match(cacheKey);

	if (cachedResponse) {
		// Cache hit: validate ETag for conditional requests
		const cachedETag = cachedResponse.headers.get("ETag");
		const ifNoneMatch = c.req.header("If-None-Match");
		if (ifNoneMatch === cachedETag) {
			c.header("Cache-Control", cacheControl);
			c.header("ETag", cachedETag);
			return c.body(null, 304);
		}
		return cachedResponse;
	}

	const result = await viewService.getPublicView(prefix, slug);
	if (result.kind === "not_found") {
		return c.html(notFoundPage, 404);
	}

	const { object, html, markdown, meta } = result;
	const templateHash = getTemplateHash(meta.theme);

	const etag = generateETag({
		templateHash,
		objectEtag: object.etag ?? object.httpEtag,
	});

	const ifNoneMatch = c.req.header("If-None-Match");
	if (ifNoneMatch === etag) {
		c.header("Cache-Control", cacheControl);
		c.header("ETag", etag);
		return c.body(null, 304);
	}

	const expirationDays = parseInt(prefix, 16);
	const uploadTime = object.uploaded.getTime();
	const expirationTime = uploadTime + expirationDays * DAY_MS;
	const expiresAt = expirationTime.toString();

	c.header("Cache-Control", cacheControl);
	c.header("ETag", etag);
	const htmlContent = `<!DOCTYPE html>${(
		<ViewTemplate
			title={meta.title || slug}
			description={meta.description}
			html={html}
			expiresAt={expiresAt}
			theme={meta.theme}
			markdown={markdown}
			lang={meta.lang}
			hasKatex={meta.hasKatex}
			hasMermaid={meta.hasMermaid}
		/>
	)}`;
	const response = c.html(htmlContent);

	c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));

	return response;
});

/**
 * Handle GET /:username/:slug request (authenticated uploads)
 * Looks up `user` + `page` in D1, then fetches content from R2 at `u/{userId}/{pageId}`.
 */
viewRouter.get("/:username/:slug", async (c) => {
	const username = c.req.param("username");
	const slug = c.req.param("slug");

	if (!isValidUserSlug(slug)) {
		return c.html(notFoundPage, 404);
	}

	const viewService = createViewService({ env: c.env, db });

	// Check cache first
	const cache = (caches as unknown as { default: Cache }).default;
	const url = new URL(c.req.url);
	url.search = "";
	const cacheKey = new Request(url, c.req.raw);
	const cachedResponse = await cache.match(cacheKey);

	if (cachedResponse) {
		// Cache hit: validate ETag for conditional requests
		const cachedETag = cachedResponse.headers.get("ETag");
		const ifNoneMatch = c.req.header("If-None-Match");
		if (ifNoneMatch === cachedETag) {
			c.header("Cache-Control", cacheControl);
			c.header("ETag", cachedETag);
			return c.body(null, 304);
		}
		return cachedResponse;
	}

	const result = await viewService.getUserView(username, slug);
	if (result.kind === "not_found") {
		return c.html(notFoundPage, 404);
	}

	const { object, html, markdown, page, lang, hasKatex, hasMermaid } = result;
	const templateHash = getTemplateHash(page.theme);

	const etag = generateETag({
		templateHash,
		objectEtag: object.etag ?? object.httpEtag,
	});

	const ifNoneMatch = c.req.header("If-None-Match");
	if (ifNoneMatch === etag) {
		c.header("Cache-Control", cacheControl);
		c.header("ETag", etag);
		return c.body(null, 304);
	}

	c.header("Cache-Control", cacheControl);
	c.header("ETag", etag);
	const htmlContent = `<!DOCTYPE html>${(
		<ViewTemplate
			title={page.title || slug}
			description={page.description}
			html={html}
			expiresAt={page.expiresAt?.toString() ?? undefined}
			theme={page.theme}
			markdown={markdown}
			lang={lang}
			hasKatex={hasKatex}
			hasMermaid={hasMermaid}
		/>
	)}`;
	const response = c.html(htmlContent);

	c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));

	return response;
});
