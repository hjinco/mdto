import { markdownToHtml } from "@shared/utils/markdown";
import { TRPCError } from "@trpc/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../../db/client";
import * as schema from "../../db/schema";
import { isDev } from "../../utils/env";
import { retryUntil } from "../../utils/retry";
import { getRemoteIp, validateTurnstile } from "../../utils/turnstile";
import { protectedProcedure, publicProcedure, router } from "../trpc";

const MAX_UPLOAD_SIZE = 100_000; // 100KB
const MAX_ACTIVE_PAGES_PER_USER = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

const themeSchema = z.enum(["default", "resume", "matrix"]);
const expirationDaysSchema = z.union([
	z.literal(1),
	z.literal(7),
	z.literal(14),
	z.literal(30),
]);

function assertMarkdownSize(markdown: string) {
	const encoder = new TextEncoder();
	const byteSize = encoder.encode(markdown).length;
	if (byteSize > MAX_UPLOAD_SIZE) {
		throw new TRPCError({
			code: "PAYLOAD_TOO_LARGE",
			message: "File size exceeds 100KB limit",
		});
	}
}

function requireNonEmptyMarkdown(markdown: string) {
	if (!markdown || markdown.trim().length === 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Markdown content is required",
		});
	}
}

function parseExpiresAtOrThrow(expiresAtMs: number) {
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
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"Invalid expiresAt. Valid values are approximately 1, 7, 14, or 30 days from now.",
		});
	}

	return new Date(expiresAtMs);
}

export const uploadRouter = router({
	publicCreate: publicProcedure
		.input(
			z.object({
				markdown: z.string(),
				expirationDays: expirationDaysSchema,
				theme: themeSchema.default("default"),
				turnstileToken: z.string().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const env = ctx.env;

			const markdown = input.markdown;
			requireNonEmptyMarkdown(markdown);
			assertMarkdownSize(markdown);

			// Validate Turnstile token (skip in development)
			if (!isDev(env)) {
				const token = input.turnstileToken;
				if (!token) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Turnstile token is required",
					});
				}

				const remoteIp = getRemoteIp(ctx.req);
				const validation = await validateTurnstile(
					token,
					remoteIp,
					env.TURNSTILE_SECRET_KEY,
				);
				if (!validation.success) {
					const errorCodes = validation["error-codes"] || ["unknown-error"];
					console.error("Turnstile validation failed:", errorCodes);
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid verification. Please try again.",
					});
				}
			}

			// Convert days to hex prefix (1→"1", 7→"7", 14→"E", 30→"1E")
			const prefix = input.expirationDays.toString(16).toUpperCase();

			const { html, metadata } = await markdownToHtml(markdown);

			const slug = await retryUntil(
				async () => nanoid(5),
				async (candidateSlug) => {
					const key = `${prefix}/${candidateSlug}`;
					const existing = await env.BUCKET.get(key);
					return !existing;
				},
			);

			if (!slug) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to generate unique slug after maximum retries",
				});
			}

			const key = `${prefix}/${slug}`;
			const jsonData = JSON.stringify({ markdown, html });
			await env.BUCKET.put(key, jsonData, {
				httpMetadata: {
					contentType: "application/json",
				},
				customMetadata: {
					theme: input.theme,
					lang: metadata.lang || "",
					title: metadata.title || "",
					description: metadata.description || "",
					hasCodeBlock: metadata.hasCodeBlock ? "1" : "",
					hasKatex: metadata.hasKatex ? "1" : "",
					hasMermaid: metadata.hasMermaid ? "1" : "",
				},
			});

			const path = `${prefix}/${slug}`;
			return { path };
		}),

	userCreate: protectedProcedure
		.input(
			z.object({
				markdown: z.string(),
				theme: themeSchema.default("default"),
				expiresAtMs: z.number().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const env = ctx.env;
			const userId = ctx.session.user.id;
			const username = ctx.session.user.name;

			const markdown = input.markdown;
			requireNonEmptyMarkdown(markdown);
			assertMarkdownSize(markdown);

			const expiresAt =
				input.expiresAtMs === null
					? null
					: parseExpiresAtOrThrow(input.expiresAtMs);

			// Enforce per-user active page quota before processing storage writes.
			const activeCountRow = await db
				.select({ count: sql<number>`count(*)`.as("count") })
				.from(schema.page)
				.where(
					and(eq(schema.page.userId, userId), isNull(schema.page.deletedAt)),
				)
				.limit(1)
				.all();

			const activeCount = Number(activeCountRow[0]?.count ?? 0);
			if (activeCount >= MAX_ACTIVE_PAGES_PER_USER) {
				throw new TRPCError({
					code: "TOO_MANY_REQUESTS",
					message: `Upload limit reached. Max ${MAX_ACTIVE_PAGES_PER_USER} pages per user.`,
				});
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
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to generate unique slug after maximum retries",
				});
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
				theme: input.theme,
				expiresAt,
				title,
				description,
			});

			await env.BUCKET.put(key, jsonData, {
				httpMetadata: {
					contentType: "application/json",
				},
				customMetadata: {
					theme: input.theme,
					lang: metadata.lang || "",
					title,
					description,
					hasCodeBlock: metadata.hasCodeBlock ? "1" : "",
					hasKatex: metadata.hasKatex ? "1" : "",
					hasMermaid: metadata.hasMermaid ? "1" : "",
				},
			}).catch(async (error: unknown) => {
				await db.delete(schema.page).where(eq(schema.page.id, pageId));
				throw error;
			});

			const path = `${username}/${slug}`;
			return {
				path,
			};
		}),
});
