import notFoundPage from "@shared/templates/not-found.html";
import { TEMPLATE_HASH } from "@shared/templates/template-hash.generated";
import { ViewTemplate } from "@shared/templates/view.template";
import { Hono } from "hono";
import { cacheControlHeader, generateETag } from "../utils/cache";
import { isValidSlug } from "../utils/slug";

export const viewRouter = new Hono<{ Bindings: Env }>();

const cacheControl = cacheControlHeader(600);

/**
 * Handle GET /:prefix/:slug request
 * Retrieves HTML from R2 and displays it
 * URL format: /{prefix}/{slug} (e.g., /1/abc123, /E/xyz789)
 */
viewRouter.get("/:prefix/:slug", async (c) => {
	const env = c.env;
	const prefix = c.req.param("prefix");
	const slug = c.req.param("slug");

	// Only allow valid prefixes: 1, 7, E, 1E
	if (!["1", "7", "E", "1E"].includes(prefix)) {
		return c.html(notFoundPage, 404);
	}

	if (!isValidSlug(slug)) {
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

	const normalizedPrefix = prefix.toUpperCase();
	const key = `${normalizedPrefix}/${slug}`;
	const object = await env.BUCKET.get(key);

	if (!object) {
		return c.html(notFoundPage, 404);
	}

	const contentType = object.httpMetadata?.contentType || "text/html";
	const theme = object.customMetadata?.theme || "default";
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

	const expirationDays = parseInt(normalizedPrefix, 16);
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
			hasKatex={hasKatex}
			hasMermaid={hasMermaid}
		/>
	)}`;
	const response = c.html(htmlContent);

	c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));

	return response;
});
