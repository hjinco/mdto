import { markdownToHtml } from "@shared/utils/markdown";
import { isDev } from "../utils/env";
import { exception, json } from "../utils/response";
import { retryUntil } from "../utils/retry";
import { generateSlug } from "../utils/slug";
import { getRemoteIp, validateTurnstile } from "../utils/turnstile";

const MAX_UPLOAD_SIZE = 100_000; // 100KB

/**
 * Handle POST /upload request
 * Receives Markdown text, generates a slug, and uploads to R2
 * Query parameter: expiration (1, 7, 14, 30 days) - defaults to 30 if not provided
 */
export async function handleUpload(
	request: Request,
	env: Env,
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const expirationParam = url.searchParams.get("expiration");

		// Valid expiration days: 1, 7, 14, 30
		const validExpirationDays = [1, 7, 14, 30];
		const expirationDays = expirationParam ? parseInt(expirationParam, 10) : 30; // Default to 30 days

		const themeParam = url.searchParams.get("theme");
		const theme = themeParam || "default";

		if (!validExpirationDays.includes(expirationDays)) {
			return exception(
				"Invalid expiration. Valid values are: 1, 7, 14, 30 (days)",
				400,
			);
		}

		// Convert days to hex prefix (1→"1", 7→"7", 14→"E", 30→"1E")
		const prefix = expirationDays.toString(16).toUpperCase();

		// Validate Turnstile token (skip in development)
		if (!isDev(env)) {
			const secretKey = env.TURNSTILE_SECRET_KEY;
			if (!secretKey) {
				console.error("TURNSTILE_SECRET_KEY is not configured");
				return exception("Verification service unavailable", 500);
			}

			const token =
				request.headers.get("X-Turnstile-Token") ||
				request.headers.get("cf-turnstile-response");

			if (!token) {
				return exception("Turnstile token is required", 400);
			}

			const remoteIp = getRemoteIp(request);
			const validation = await validateTurnstile(token, remoteIp, secretKey);

			if (!validation.success) {
				const errorCodes = validation["error-codes"] || ["unknown-error"];
				console.error("Turnstile validation failed:", errorCodes);

				// Return user-friendly error message
				return exception("Invalid verification. Please try again.", 400);
			}
		} else {
			// Development mode: Turnstile validation disabled
			console.log("Turnstile validation skipped (development mode)");
		}

		// Check Content-Length header before reading the body
		const contentLength = request.headers.get("Content-Length");
		if (contentLength) {
			const size = parseInt(contentLength, 10);
			if (!Number.isNaN(size) && size > MAX_UPLOAD_SIZE) {
				return exception("File size exceeds 100KB limit", 413);
			}
		}

		const markdown = await request.text();

		// Verify actual byte size (in case Content-Length was missing or incorrect)
		const encoder = new TextEncoder();
		const byteSize = encoder.encode(markdown).length;
		if (byteSize > MAX_UPLOAD_SIZE) {
			return exception("File size exceeds 100KB limit", 413);
		}

		if (!markdown || markdown.trim().length === 0) {
			return exception("Markdown content is required", 400);
		}

		const html = await markdownToHtml(markdown);

		const slug = await retryUntil(
			async () => generateSlug(),
			async (slug) => {
				const key = `${prefix}/${slug}`;
				const existing = await env.BUCKET.get(key);
				return !existing;
			},
		);

		if (!slug) {
			return exception(
				"Failed to generate unique slug after maximum retries",
				500,
			);
		}

		const key = `${prefix}/${slug}`;
		const jsonData = JSON.stringify({
			markdown,
			html,
		});
		await env.BUCKET.put(key, jsonData, {
			httpMetadata: {
				contentType: "application/json",
			},
			customMetadata: {
				theme,
			},
		});

		return json({ slug: `${prefix}/${slug}` });
	} catch (error) {
		console.error("Upload error:", error);
		return exception("Failed to upload markdown");
	}
}
