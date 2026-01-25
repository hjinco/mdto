import notFoundPage from "@shared/templates/not-found.html";
import { TEMPLATE_HASH } from "@shared/templates/template-hash.generated";
import { ViewTemplate } from "@shared/templates/view.template";
import { and, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import * as schema from "../db/schema";
import { cacheControlHeader, generateETag } from "../utils/cache";

export const viewRouter = new Hono<{ Bindings: Env }>();

const cacheControl = cacheControlHeader(600);
const PUBLIC_SLUG_REGEX = /^[a-zA-Z0-9_-]{5}$/;
const USER_SLUG_REGEX = /^[a-zA-Z0-9_-]{4}$/;
const isValidPublicSlug = (slug: string) => PUBLIC_SLUG_REGEX.test(slug);
const isValidUserSlug = (slug: string) => USER_SLUG_REGEX.test(slug);

/**
 * Handle GET /:prefix/:slug request
 * Retrieves HTML from R2 and displays it
 * URL format: /{prefix}/{slug} (e.g., /1/abc123, /E/xyz789)
 */
viewRouter.get("/:prefix{^(1[Ee]|1|7|[Ee])$}/:slug", async (c) => {
	const env = c.env;
	const prefix = c.req.param("prefix").toUpperCase();
	const slug = c.req.param("slug");

	if (!isValidPublicSlug(slug)) {
		return c.html(notFoundPage, 404);
	}

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

	const key = `${prefix}/${slug}`;
	const object = await env.BUCKET.get(key);

	if (!object) {
		return c.html(notFoundPage, 404);
	}

	const contentType = object.httpMetadata?.contentType || "text/html";
	const theme = object.customMetadata?.theme || "default";
	const lang = object.customMetadata?.lang || "";
	const metaTitle = object.customMetadata?.title || "";
	const metaDescription = object.customMetadata?.description || "";
	// const hasCodeBlock = object.customMetadata?.hasCodeBlock === "1";
	const hasKatex = object.customMetadata?.hasKatex === "1";
	const hasMermaid = object.customMetadata?.hasMermaid === "1";

	let markdown: string | undefined;
	let html: string;

	// Handle both old format (text/html) and new format (application/json)
	if (contentType === "application/json") {
		const jsonData = await object.json<{ html: string; markdown: string }>();
		markdown = jsonData.markdown;
		html = jsonData.html;
	} else {
		// Legacy format: HTML only
		markdown = undefined;
		html = await object.text();
	}

	const etag = generateETag({
		templateHash: TEMPLATE_HASH,
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
	const expirationTime = uploadTime + expirationDays * 24 * 60 * 60 * 1000;
	const expiresAt = expirationTime.toString();

	c.header("Cache-Control", cacheControl);
	c.header("ETag", etag);
	const htmlContent = `<!DOCTYPE html>${(
		<ViewTemplate
			title={metaTitle || slug}
			description={metaDescription}
			html={html}
			expiresAt={expiresAt}
			theme={theme}
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

/**
 * Handle GET /:username/:slug request (authenticated uploads)
 * Looks up `user` + `page` in D1, then fetches content from R2 at `u/{userId}/{pageId}`.
 */
viewRouter.get("/:username/:slug", async (c) => {
	const env = c.env;
	const username = c.req.param("username");
	const slug = c.req.param("slug");

	if (!isValidUserSlug(slug)) {
		return c.html(notFoundPage, 404);
	}

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

	const [user] = await db
		.select({ id: schema.user.id })
		.from(schema.user)
		.where(eq(schema.user.name, username))
		.limit(1)
		.all();

	if (!user) {
		return c.html(notFoundPage, 404);
	}

	const [page] = await db
		.select({
			id: schema.page.id,
			theme: schema.page.theme,
			expiresAt: schema.page.expiresAt,
			title: schema.page.title,
			description: schema.page.description,
			deletedAt: schema.page.deletedAt,
		})
		.from(schema.page)
		.where(
			and(
				eq(schema.page.userId, user.id),
				eq(schema.page.slug, slug),
				isNull(schema.page.deletedAt),
			),
		)
		.limit(1)
		.all();

	if (!page) {
		return c.html(notFoundPage, 404);
	}

	const key = `u/${user.id}/${page.id}`;
	const object = await env.BUCKET.get(key);

	if (!object) {
		return c.html(notFoundPage, 404);
	}

	const lang = object.customMetadata?.lang || "";
	const hasKatex = object.customMetadata?.hasKatex === "1";
	const hasMermaid = object.customMetadata?.hasMermaid === "1";

	const jsonData = await object.json<{ html: string; markdown: string }>();
	const markdown = jsonData.markdown;
	const html = jsonData.html;

	const etag = generateETag({
		templateHash: TEMPLATE_HASH,
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
