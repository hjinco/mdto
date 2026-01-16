import { handleUpload } from "./routes/upload.route";
import { handleView } from "./routes/view.route";
import htmlTemplate from "./templates/upload.template.html";
import { html, text } from "./utils/response";

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;
		const method = request.method;

		// POST /upload - Upload markdown
		if (method === "POST" && pathname === "/upload") {
			return handleUpload(request, env);
		}

		// GET /:prefix/:slug - View markdown as HTML
		// GET / - Show upload page
		if (method === "GET") {
			if (pathname === "/") {
				return html(htmlTemplate);
			}

			// Parse /{prefix}/{slug} pattern
			const parts = pathname.slice(1).split("/");

			if (parts.length === 2) {
				const [prefix, slug] = parts;
				return handleView(prefix, slug, env);
			}

			// Fallback for old format (backward compatibility)
			// Try to find the file without prefix (for existing files)
			const slug = pathname.slice(1);
			if (slug) {
				return handleView("", slug, env);
			}

			return text("Not found", 404);
		}

		return text("Not found", 404);
	},
} satisfies ExportedHandler<Env>;
