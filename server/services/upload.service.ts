import { markdownToHtml } from "@shared/markdown";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { db as dbType } from "../db/client";
import { objectExists, putJsonObject } from "../infra/r2";
import { getRemoteIp, validateTurnstile } from "../infra/turnstile";
import { createPageRepo } from "../repositories/page.repo";
import { isDev } from "../utils/env";
import { retryUntil } from "../utils/retry";

const MAX_UPLOAD_SIZE = 100_000; // 100KB
const MAX_ACTIVE_PAGES_PER_USER = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

export const themeSchema = z.enum(["default", "resume", "matrix"]);
export const expirationDaysSchema = z.union([
	z.literal(1),
	z.literal(7),
	z.literal(14),
	z.literal(30),
]);

export type PublicCreateInput = {
	markdown: string;
	expirationDays: z.infer<typeof expirationDaysSchema>;
	theme: z.infer<typeof themeSchema>;
	turnstileToken: string | null;
};

export type UserCreateInput = {
	markdown: string;
	theme: z.infer<typeof themeSchema>;
	expiresAtMs: number | null;
};

type Db = typeof dbType;

type UploadServiceDeps = {
	env: Env;
	req: Request;
	db: Db;
};

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

export function createUploadService({ env, req, db }: UploadServiceDeps) {
	const pageRepo = createPageRepo(db);

	return {
		async publicCreate(input: PublicCreateInput) {
			const markdown = input.markdown;
			requireNonEmptyMarkdown(markdown);
			assertMarkdownSize(markdown);

			if (!isDev(env)) {
				const token = input.turnstileToken;
				if (!token) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Turnstile token is required",
					});
				}

				const remoteIp = getRemoteIp(req);
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

			const prefix = input.expirationDays.toString(16).toUpperCase();
			const { html, metadata } = await markdownToHtml(markdown);

			const slug = await retryUntil(
				async () => nanoid(5),
				async (candidateSlug) => {
					const key = `${prefix}/${candidateSlug}`;
					return !(await objectExists(env, key));
				},
			);

			if (!slug) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to generate unique slug after maximum retries",
				});
			}

			const key = `${prefix}/${slug}`;
			await putJsonObject(
				env,
				key,
				{ markdown, html },
				{
					theme: input.theme,
					lang: metadata.lang || "",
					title: metadata.title || "",
					description: metadata.description || "",
					hasCodeBlock: metadata.hasCodeBlock,
					hasKatex: metadata.hasKatex,
					hasMermaid: metadata.hasMermaid,
					hasWikiLink: metadata.hasWikiLink,
				},
			);

			return { path: `${prefix}/${slug}` };
		},

		async userCreate(
			input: UserCreateInput,
			user: { id: string; name: string },
		) {
			const markdown = input.markdown;
			requireNonEmptyMarkdown(markdown);
			assertMarkdownSize(markdown);

			const expiresAt =
				input.expiresAtMs === null
					? null
					: parseExpiresAtOrThrow(input.expiresAtMs);

			const activeCount = await pageRepo.countActiveByUser(user.id);
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
					return !(await pageRepo.slugExistsForUser(user.id, candidateSlug));
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

			const key = `u/${user.id}/${pageId}`;
			await pageRepo.insert({
				id: pageId,
				userId: user.id,
				slug,
				theme: input.theme,
				expiresAt,
				title,
				description,
			});

			await putJsonObject(
				env,
				key,
				{ markdown, html },
				{
					theme: input.theme,
					lang: metadata.lang || "",
					title,
					description,
					hasCodeBlock: metadata.hasCodeBlock,
					hasKatex: metadata.hasKatex,
					hasMermaid: metadata.hasMermaid,
					hasWikiLink: metadata.hasWikiLink,
				},
			).catch(async (error: unknown) => {
				await pageRepo.deleteById(pageId);
				throw error;
			});

			return { path: `${user.name}/${slug}` };
		},
	};
}
