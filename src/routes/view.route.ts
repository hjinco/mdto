import { createViewHtml } from "../templates/view.template";
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
			return text("Invalid slug format", 400);
		}

		const key = `${prefix}/${slug}`;
		const object = await env.BUCKET.get(key);

		if (!object) {
			return text("Not found", 404);
		}

		const htmlContent = await object.text();
		const htmlPage = createViewHtml(slug, htmlContent);

		return html(htmlPage);
	} catch (error) {
		console.error("View error:", error);
		return text("Internal server error", 500);
	}
}
