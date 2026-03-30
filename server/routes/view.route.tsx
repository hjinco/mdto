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
const isValidPublicSlug = (slug: string) => PUBLIC_SLUG_REGEX.test(slug);
const DAY_MS = 24 * 60 * 60 * 1000;
const HTML_TEMPLATE_HASH = getTemplateHash();
const RAW_MARKDOWN_TEMPLATE_HASH = "raw-markdown";
const MARKDOWN_SUFFIX = ".md";

type ViewContext = Parameters<Parameters<typeof viewRouter.get>[1]>[0];

function getCache() {
	return (caches as unknown as { default: Cache }).default;
}

function buildCacheKey(c: ViewContext) {
	const url = new URL(c.req.url);
	url.search = "";
	return new Request(url.toString(), {
		method: "GET",
		headers: c.req.raw.headers,
	});
}

async function handleCachedResponse(c: ViewContext, cacheKey: Request) {
	const cache = getCache();
	const cachedResponse = await cache.match(cacheKey);

	if (!cachedResponse) {
		return null;
	}

	const cachedETag = cachedResponse.headers.get("ETag");
	const ifNoneMatch = c.req.header("If-None-Match");
	if (ifNoneMatch === cachedETag) {
		c.header("Cache-Control", cacheControl);
		if (cachedETag) {
			c.header("ETag", cachedETag);
		}
		return c.body(null, 304);
	}

	return cachedResponse;
}

function setCachingHeaders(c: ViewContext, etag: string) {
	c.header("Cache-Control", cacheControl);
	c.header("ETag", etag);
}

function getRepresentationEtag(objectEtag: string, kind: "html" | "markdown") {
	return generateETag({
		templateHash:
			kind === "html" ? HTML_TEMPLATE_HASH : RAW_MARKDOWN_TEMPLATE_HASH,
		objectEtag,
	});
}

function shouldReturnNotModified(c: ViewContext, etag: string) {
	return c.req.header("If-None-Match") === etag;
}

function cacheResponse(c: ViewContext, cacheKey: Request, response: Response) {
	c.executionCtx.waitUntil(getCache().put(cacheKey, response.clone()));
}

function htmlResponse(
	title: string,
	description: string,
	html: string,
	expiresAt: string | undefined,
	theme: string,
	markdown: string | undefined,
	lang: string,
	hasKatex: boolean,
	hasMermaid: boolean,
) {
	return `<!DOCTYPE html>${(
		<ViewTemplate
			title={title}
			description={description}
			html={html}
			expiresAt={expiresAt}
			theme={theme}
			markdown={markdown}
			lang={lang}
			hasKatex={hasKatex}
			hasMermaid={hasMermaid}
		/>
	)}`;
}

function markdownResponse(c: ViewContext, markdown: string) {
	c.header("Content-Type", "text/markdown; charset=utf-8");
	return c.body(markdown);
}

/**
 * Handle GET /:prefix/:slug request
 * Retrieves HTML from R2 and displays it
 * URL format: /{prefix}/{slug} (e.g., /1/abc123, /E/xyz789)
 */
viewRouter.get("/:prefix{^(1[Ee]|1|7|[Ee])$}/:slug", async (c) => {
	const prefix = c.req.param("prefix").toUpperCase();
	const slugParam = c.req.param("slug");
	const isMarkdownRequest = slugParam.endsWith(MARKDOWN_SUFFIX);
	const slug = isMarkdownRequest
		? slugParam.slice(0, -MARKDOWN_SUFFIX.length)
		: slugParam;

	if (!isValidPublicSlug(slug)) {
		return c.html(notFoundPage, 404);
	}

	const viewService = createViewService({ env: c.env, db });

	const cacheKey = buildCacheKey(c);
	const cachedResponse = await handleCachedResponse(c, cacheKey);
	if (cachedResponse) {
		return cachedResponse;
	}

	const result = await viewService.getPublicView(prefix, slug);
	if (result.kind === "not_found") {
		return c.html(notFoundPage, 404);
	}

	const { object, html, markdown, meta } = result;
	if (isMarkdownRequest && !markdown) {
		return c.html(notFoundPage, 404);
	}

	const etag = getRepresentationEtag(
		object.etag ?? object.httpEtag,
		isMarkdownRequest ? "markdown" : "html",
	);
	if (shouldReturnNotModified(c, etag)) {
		setCachingHeaders(c, etag);
		return c.body(null, 304);
	}

	if (isMarkdownRequest) {
		setCachingHeaders(c, etag);
		const response = markdownResponse(c, markdown);
		cacheResponse(c, cacheKey, response);
		return response;
	}

	const expirationDays = parseInt(prefix, 16);
	const uploadTime = object.uploaded.getTime();
	const expirationTime = uploadTime + expirationDays * DAY_MS;
	const expiresAt = expirationTime.toString();

	setCachingHeaders(c, etag);
	const htmlContent = htmlResponse(
		meta.title || slug,
		meta.description,
		html,
		expiresAt,
		meta.theme,
		markdown,
		meta.lang,
		meta.hasKatex,
		meta.hasMermaid,
	);
	const response = c.html(htmlContent);

	cacheResponse(c, cacheKey, response);
	return response;
});

/**
 * Handle GET /:username/:slug request (authenticated uploads)
 * Looks up `user` + `page` in D1, then fetches content from R2 at `u/{userId}/{pageId}`.
 */
viewRouter.get("/:username/:slug", async (c) => {
	const username = c.req.param("username").toLowerCase();
	const slugParam = c.req.param("slug");
	const isMarkdownRequest = slugParam.endsWith(MARKDOWN_SUFFIX);
	const slug = isMarkdownRequest
		? slugParam.slice(0, -MARKDOWN_SUFFIX.length)
		: slugParam;

	const viewService = createViewService({ env: c.env, db });

	const cacheKey = buildCacheKey(c);
	const cachedResponse = await handleCachedResponse(c, cacheKey);
	if (cachedResponse) {
		return cachedResponse;
	}

	const result = await viewService.getUserView(username, slug);
	if (result.kind === "not_found") {
		return c.html(notFoundPage, 404);
	}

	const { object, html, markdown, page, lang, hasKatex, hasMermaid } = result;
	const etag = getRepresentationEtag(
		object.etag ?? object.httpEtag,
		isMarkdownRequest ? "markdown" : "html",
	);
	if (shouldReturnNotModified(c, etag)) {
		setCachingHeaders(c, etag);
		return c.body(null, 304);
	}

	if (isMarkdownRequest) {
		setCachingHeaders(c, etag);
		const response = markdownResponse(c, markdown);
		cacheResponse(c, cacheKey, response);
		return response;
	}

	setCachingHeaders(c, etag);
	const htmlContent = htmlResponse(
		page.title || slug,
		page.description,
		html,
		page.expiresAt?.toString() ?? undefined,
		page.theme,
		markdown,
		lang,
		hasKatex,
		hasMermaid,
	);
	const response = c.html(htmlContent);

	cacheResponse(c, cacheKey, response);
	return response;
});
