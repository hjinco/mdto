import { markdownToHtml } from "@shared/utils/markdown";
import { Hono } from "hono";
import { isDev } from "../utils/env";
import { retryUntil } from "../utils/retry";
import { generateSlug } from "../utils/slug";
import { getRemoteIp, validateTurnstile } from "../utils/turnstile";

const MAX_UPLOAD_SIZE = 100_000; // 100KB

export const uploadRouter = new Hono<{ Bindings: Env }>();

/**
 * Handle POST /upload request
 * Receives Markdown text, generates a slug, and uploads to R2
 * Query parameter: expiration (1, 7, 14, 30 days) - defaults to 30 if not provided
 */
uploadRouter.post("/api/upload", async (c) => {
	try {
		const env = c.env;
		const request = c.req.raw;
		const expirationParam = c.req.query("expiration");

		// Valid expiration days: 1, 7, 14, 30
		const validExpirationDays = [1, 7, 14, 30];
		const expirationDays = expirationParam ? parseInt(expirationParam, 10) : 30; // Default to 30 days

		const themeParam = c.req.query("theme");
		const validThemes = ["default", "resume", "matrix"];
		const theme =
			themeParam && validThemes.includes(themeParam) ? themeParam : "default";

		if (!validExpirationDays.includes(expirationDays)) {
			return c.json(
				{ error: "Invalid expiration. Valid values are: 1, 7, 14, 30 (days)" },
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
				return c.json({ error: "Verification service unavailable" }, 500);
			}

			const token =
				c.req.header("X-Turnstile-Token") ||
				c.req.header("cf-turnstile-response");

			if (!token) {
				return c.json({ error: "Turnstile token is required" }, 400);
			}

			const remoteIp = getRemoteIp(request);
			const validation = await validateTurnstile(token, remoteIp, secretKey);

			if (!validation.success) {
				const errorCodes = validation["error-codes"] || ["unknown-error"];
				console.error("Turnstile validation failed:", errorCodes);

				return c.json(
					{ error: "Invalid verification. Please try again." },
					400,
				);
			}
		} else {
			console.log("Turnstile validation skipped (development mode)");
		}

		const contentLength = c.req.header("Content-Length");
		if (contentLength) {
			const size = parseInt(contentLength, 10);
			if (!Number.isNaN(size) && size > MAX_UPLOAD_SIZE) {
				return c.json({ error: "File size exceeds 100KB limit" }, 413);
			}
		}

		const markdown = await c.req.text();

		// Verify actual byte size (in case Content-Length was missing or incorrect)
		const encoder = new TextEncoder();
		const byteSize = encoder.encode(markdown).length;
		if (byteSize > MAX_UPLOAD_SIZE) {
			return c.json({ error: "File size exceeds 100KB limit" }, 413);
		}

		if (!markdown || markdown.trim().length === 0) {
			return c.json({ error: "Markdown content is required" }, 400);
		}

		const { html, metadata } = await markdownToHtml(markdown);

		const slug = await retryUntil(
			async () => generateSlug(),
			async (slug) => {
				const key = `${prefix}/${slug}`;
				const existing = await env.BUCKET.get(key);
				return !existing;
			},
		);

		if (!slug) {
			return c.json(
				{ error: "Failed to generate unique slug after maximum retries" },
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
				title: metadata.title || "",
				description: metadata.description || "",
				hasCodeBlock: metadata.hasCodeBlock ? "1" : "",
				hasKatex: metadata.hasKatex ? "1" : "",
				hasMermaid: metadata.hasMermaid ? "1" : "",
			},
		});

		return c.json({ slug: `${prefix}/${slug}` });
	} catch (error) {
		console.error("Upload error:", error);
		return c.json({ error: "Failed to upload markdown" }, 500);
	}
});
