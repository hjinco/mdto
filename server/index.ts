import { handleUpload } from "./routes/upload.route";
import { handleView } from "./routes/view.route";
import { text } from "./utils/response";

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;
		const method = request.method;

		// POST /upload - Upload markdown
		if (method === "POST" && pathname === "/api/upload") {
			return handleUpload(request, env);
		}

		// GET /:prefix/:slug - View markdown as HTML
		// GET / - Show upload page
		if (method === "GET") {
			// Parse /{prefix}/{slug} pattern
			const parts = pathname.slice(1).split("/");

			if (parts.length === 2) {
				const [prefix, slug] = parts;
				return handleView(prefix, slug, env);
			}

			return text("Not found", 404);
		}

		return text("Not found", 404);
	},
} satisfies ExportedHandler<Env>;
