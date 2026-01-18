import notFoundPage from "@shared/templates/not-found.html";
import { createHtmlPage } from "@shared/templates/view.template";
import { calculateCacheControlHeader } from "../utils/cache";
import * as res from "../utils/response";
import { isValidSlug } from "../utils/slug";

/**
 * Handle GET /:prefix/:slug request
 * Retrieves HTML from R2 and displays it
 * URL format: /{prefix}/{slug} (e.g., /1/abc123, /E/xyz789)
 */
export async function handleView(
	prefix: string,
	slug: string,
	env: Env,
): Promise<Response> {
	try {
		if (!isValidSlug(slug)) {
			return res.text("Invalid slug format", 400, "no-cache");
		}

		const normalizedPrefix = prefix.toUpperCase();
		const key = `${normalizedPrefix}/${slug}`;
		const object = await env.BUCKET.get(key);

		if (!object) {
			return res.html(notFoundPage, 404);
		}

		const contentType = object.httpMetadata?.contentType || "text/html";
		const theme = object.customMetadata?.theme || "default";

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

		// Calculate expiration time from prefix and upload date
		const expirationDays = parseInt(normalizedPrefix, 16);
		const uploadTime = object.uploaded.getTime();
		const expirationTime = uploadTime + expirationDays * 24 * 60 * 60 * 1000;
		const expiresAt = expirationTime.toString();

		const htmlPage = createHtmlPage({
			title: slug,
			html,
			expiresAt,
			theme,
			markdown,
		});

		// Calculate remaining cache time
		const cacheHeader = calculateCacheControlHeader(Date.now(), expirationTime);

		return res.html(htmlPage, 200, cacheHeader);
	} catch (error) {
		console.error("View error:", error);
		return res.text("Internal server error", 500, "no-cache");
	}
}
