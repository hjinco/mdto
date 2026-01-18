import notFoundPage from "@shared/templates/not-found.html";
import { createHtmlPage } from "@shared/templates/view.template";
import { html, text } from "../utils/response";
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
			return text("Invalid slug format", 400, "no-cache");
		}

		const normalizedPrefix = prefix.toUpperCase();
		const key = `${normalizedPrefix}/${slug}`;
		const object = await env.BUCKET.get(key);

		if (!object) {
			return html(notFoundPage, 404);
		}

		const htmlContent = await object.text();
		const theme = object.customMetadata?.theme || "default";

		// Calculate expiration time from prefix and upload date
		const expirationDays = parseInt(normalizedPrefix, 16);
		const uploadTime = object.uploaded.getTime();
		const expirationTime = uploadTime + expirationDays * 24 * 60 * 60 * 1000;
		const expiresAt = expirationTime.toString();

		const htmlPage = createHtmlPage(slug, htmlContent, theme, expiresAt);

		// Cache successful responses for 30 days (2592000 seconds)
		return html(htmlPage, 200, "public, max-age=2592000");
	} catch (error) {
		console.error("View error:", error);
		return text("Internal server error", 500, "no-cache");
	}
}
