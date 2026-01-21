import notFoundPage from "@shared/templates/not-found.html";
import { TEMPLATE_HASH } from "@shared/templates/template-hash.generated";
import { createHtmlPage } from "@shared/templates/view.template";
import { Hono } from "hono";
import { cacheControlHeader, generateETag } from "../utils/cache";
import { isValidSlug } from "../utils/slug";

export const viewRouter = new Hono<{ Bindings: Env }>();

/**
 * Handle GET /:prefix/:slug request
 * Retrieves HTML from R2 and displays it
 * URL format: /{prefix}/{slug} (e.g., /1/abc123, /E/xyz789)
 */
viewRouter.get("/:prefix/:slug", async (c) => {
	try {
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
			const cacheHeader = cacheControlHeader(600);
			c.header("Cache-Control", cacheHeader);
			c.header("ETag", etag);
			return c.body(null, 304);
		}

		const expirationDays = parseInt(normalizedPrefix, 16);
		const uploadTime = object.uploaded.getTime();
		const expirationTime = uploadTime + expirationDays * 24 * 60 * 60 * 1000;
		const expiresAt = expirationTime.toString();

		const htmlPage = createHtmlPage({
			title: metaTitle || slug,
			description: metaDescription,
			html,
			expiresAt,
			theme,
			markdown,
			hasKatex,
			hasMermaid,
		});

		const cacheHeader = cacheControlHeader(600);

		c.header("Cache-Control", cacheHeader);
		c.header("ETag", etag);
		return c.html(htmlPage);
	} catch (error) {
		console.error("View error:", error);
		c.header("Cache-Control", "no-cache");
		return c.text("Internal server error", 500);
	}
});
