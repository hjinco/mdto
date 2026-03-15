import { markdownToHtml } from "@shared/markdown";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const MAX_UPLOAD_SIZE = 100_000; // 100KB
export const MAX_ACTIVE_PAGES_PER_USER = 10;
export const DAY_MS = 24 * 60 * 60 * 1000;

export const themeSchema = z.enum(["default", "resume", "matrix"]);
export const expirationDaysSchema = z.union([
	z.literal(1),
	z.literal(7),
	z.literal(14),
	z.literal(30),
]);
export const pageSlugSchema = z
	.string()
	.trim()
	.min(1)
	.max(64)
	.regex(/^[a-zA-Z0-9_-]+$/);

export function assertMarkdownSize(markdown: string) {
	const encoder = new TextEncoder();
	const byteSize = encoder.encode(markdown).length;
	if (byteSize > MAX_UPLOAD_SIZE) {
		throw new TRPCError({
			code: "PAYLOAD_TOO_LARGE",
			message: "File size exceeds 100KB limit",
		});
	}
}

export function requireNonEmptyMarkdown(markdown: string) {
	if (!markdown || markdown.trim().length === 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Markdown content is required",
		});
	}
}

export function parseExpiresAtOrThrow(expiresAtMs: number) {
	const validExpirationDays = [1, 7, 14, 30];
	const nowMs = Date.now();
	const deltaMs = expiresAtMs - nowMs;
	const expirationDays = Math.round(deltaMs / DAY_MS);
	const expectedDeltaMs = expirationDays * DAY_MS;
	const toleranceMs = 10 * 60 * 1000;

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

export async function renderPageContent(markdown: string) {
	requireNonEmptyMarkdown(markdown);
	assertMarkdownSize(markdown);

	const { html, metadata } = await markdownToHtml(markdown);

	return {
		html,
		metadata,
	};
}
