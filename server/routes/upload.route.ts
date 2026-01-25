import { markdownToHtml } from "@shared/utils/markdown";
import { and, eq, isNull, sql } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import { db } from "../db/client";
import * as schema from "../db/schema";
import { auth } from "../lib/auth";
import { isDev } from "../utils/env";
import { retryUntil } from "../utils/retry";
import { getRemoteIp, validateTurnstile } from "../utils/turnstile";

const MAX_UPLOAD_SIZE = 100_000; // 100KB
const MAX_ACTIVE_PAGES_PER_USER = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

export const uploadRouter = new Hono<{ Bindings: Env }>();

/**
 * Handle POST /upload request
 * Receives Markdown text, generates a slug, and uploads to R2
 * Query parameter: expiration (1, 7, 14, 30 days) - defaults to 30 if not provided
 */
uploadRouter.post("/upload", async (c) => {
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

			return c.json({ error: "Invalid verification. Please try again." }, 400);
		}
	} else {
		console.log("Turnstile validation skipped (development mode)");
	}

	const contentLength = c.req.header("Content-Length");
	if (contentLength && parseInt(contentLength, 10) > MAX_UPLOAD_SIZE) {
		return c.json({ error: "File size exceeds 100KB limit" }, 413);
	}

	const markdown = await c.req.text();

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
		async () => nanoid(5),
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
			lang: metadata.lang || "",
			title: metadata.title || "",
			description: metadata.description || "",
			hasCodeBlock: metadata.hasCodeBlock ? "1" : "",
			hasKatex: metadata.hasKatex ? "1" : "",
			hasMermaid: metadata.hasMermaid ? "1" : "",
		},
	});

	return c.json({ slug: `${prefix}/${slug}` });
});

/**
 * Handle POST /u/upload request (authenticated)
 * - Requires a valid Better Auth session
 * - Creates a `page` record in D1
 * - Stores content in R2 under `u/{userId}/{pageId}`
 * - Returns view path as `{username}/{slug}`
 */
uploadRouter.post("/u/upload", async (c) => {
	const env = c.env;

	const session = await auth.api.getSession(c.req.raw);
	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const userId = session.user.id;
	const username = session.user.name;

	const expiresAtParam = c.req.query("expiresAt");
	if (expiresAtParam === undefined) {
		return c.json({ error: "expiresAt is required" }, 400);
	}

	// Permanent pages send an empty query value (`?expiresAt=`).
	const isPermanent = expiresAtParam === "";
	let expiresAt: Date | null = null;

	if (!isPermanent) {
		const expiresAtMs = Number(expiresAtParam);
		if (!Number.isFinite(expiresAtMs)) {
			return c.json({ error: "Invalid expiresAt" }, 400);
		}

		const validExpirationDays = [1, 7, 14, 30];
		const nowMs = Date.now();
		const deltaMs = expiresAtMs - nowMs;
		const expirationDays = Math.round(deltaMs / DAY_MS);
		const expectedDeltaMs = expirationDays * DAY_MS;
		const toleranceMs = 10 * 60 * 1000; // allow small clock skew / network delay

		if (
			deltaMs <= 0 ||
			!validExpirationDays.includes(expirationDays) ||
			Math.abs(deltaMs - expectedDeltaMs) > toleranceMs
		) {
			return c.json(
				{
					error:
						"Invalid expiresAt. Valid values are approximately 1, 7, 14, or 30 days from now.",
				},
				400,
			);
		}

		expiresAt = new Date(expiresAtMs);
	}

	const themeParam = c.req.query("theme");
	const validThemes = ["default", "resume", "matrix"];
	const theme =
		themeParam && validThemes.includes(themeParam) ? themeParam : "default";

	// Enforce per-user active page quota before processing body.
	const activeCountRow = await db
		.select({ count: sql<number>`count(*)`.as("count") })
		.from(schema.page)
		.where(and(eq(schema.page.userId, userId), isNull(schema.page.deletedAt)))
		.limit(1)
		.all();

	const activeCount = Number(activeCountRow[0]?.count ?? 0);
	if (activeCount >= MAX_ACTIVE_PAGES_PER_USER) {
		return c.json(
			{
				error: `Upload limit reached. Max ${MAX_ACTIVE_PAGES_PER_USER} pages per user.`,
			},
			429,
		);
	}

	const contentLength = c.req.header("Content-Length");
	if (contentLength && parseInt(contentLength, 10) > MAX_UPLOAD_SIZE) {
		return c.json({ error: "File size exceeds 100KB limit" }, 413);
	}

	const markdown = await c.req.text();
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
		async () => nanoid(4),
		async (candidateSlug) => {
			const existing = await db
				.select({ id: schema.page.id })
				.from(schema.page)
				.where(
					and(
						eq(schema.page.userId, userId),
						eq(schema.page.slug, candidateSlug),
						isNull(schema.page.deletedAt),
					),
				)
				.limit(1)
				.all();
			return existing.length === 0;
		},
	);

	if (!slug) {
		return c.json(
			{ error: "Failed to generate unique slug after maximum retries" },
			500,
		);
	}

	const pageId = crypto.randomUUID();
	const title = (metadata.title || "").trim() || slug;
	const description = (metadata.description || "").trim();

	const key = `u/${userId}/${pageId}`;
	const jsonData = JSON.stringify({ markdown, html });

	await db.insert(schema.page).values({
		id: pageId,
		userId,
		slug,
		theme,
		expiresAt,
		title,
		description,
	});

	await env.BUCKET.put(key, jsonData, {
		httpMetadata: {
			contentType: "application/json",
		},
		customMetadata: {
			theme,
			lang: metadata.lang || "",
			title,
			description,
			hasCodeBlock: metadata.hasCodeBlock ? "1" : "",
			hasKatex: metadata.hasKatex ? "1" : "",
			hasMermaid: metadata.hasMermaid ? "1" : "",
		},
	}).catch(async (error) => {
		await db.delete(schema.page).where(eq(schema.page.id, pageId));
		throw error;
	});

	const path = `${username}/${slug}`;
	return c.json({
		slug: path, // keep compatibility with existing client
		path,
		pageId,
	});
});
