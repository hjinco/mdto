import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import type { z } from "zod";
import type { db as dbType } from "../db/client";
import { putJsonObject } from "../infra/r2";
import { createPageRepo } from "../repositories/page.repo";
import { retryUntil } from "../utils/retry";
import {
	MAX_ACTIVE_PAGES_PER_USER,
	pageSlugSchema,
	parseExpiresAtOrThrow,
	renderPageContent,
	type themeSchema,
} from "./page-content.service";

type Db = typeof dbType;

type PageOwner = {
	id: string;
	name: string;
};

type ManagedPageSummary = {
	id: string;
	slug: string;
	path: string;
	title: string;
	description: string;
	theme: z.infer<typeof themeSchema>;
	expiresAt: string | null;
	createdAt: string;
	updatedAt: string;
};

type CreateManagedPageInput = {
	markdown: string;
	slug?: string;
	theme: z.infer<typeof themeSchema>;
	expiresAtMs: number | null;
};

type UpdateManagedPageInput = {
	currentSlug: string;
	markdown: string;
	newSlug?: string;
	theme?: z.infer<typeof themeSchema>;
	expiresAtMs?: number | null;
};

function toSummary(
	user: PageOwner,
	page: {
		id: string;
		slug: string;
		title: string;
		description: string;
		theme: string;
		expiresAt: Date | null;
		createdAt: Date;
		updatedAt: Date;
	},
): ManagedPageSummary {
	return {
		id: page.id,
		slug: page.slug,
		path: `/${user.name}/${page.slug}`,
		title: page.title,
		description: page.description,
		theme: page.theme as z.infer<typeof themeSchema>,
		expiresAt: page.expiresAt ? page.expiresAt.toISOString() : null,
		createdAt: page.createdAt.toISOString(),
		updatedAt: page.updatedAt.toISOString(),
	};
}

export function createManagedPageService({ env, db }: { env: Env; db: Db }) {
	const pageRepo = createPageRepo(db);
	const findOwnedPageByIdOrThrow = async (userId: string, pageId: string) => {
		const page = await pageRepo.findActiveById(pageId);
		if (!page) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
		}

		if (page.userId !== userId) {
			throw new TRPCError({ code: "FORBIDDEN", message: "Forbidden" });
		}

		return page;
	};

	return {
		async listForUser(user: PageOwner) {
			const pages = await pageRepo.listByUser(user.id);
			return pages.map((page) => toSummary(user, page));
		},

		async createPage(input: CreateManagedPageInput, user: PageOwner) {
			const activeCount = await pageRepo.countActiveByUser(user.id);
			if (activeCount >= MAX_ACTIVE_PAGES_PER_USER) {
				throw new TRPCError({
					code: "TOO_MANY_REQUESTS",
					message: `Upload limit reached. Max ${MAX_ACTIVE_PAGES_PER_USER} pages per user.`,
				});
			}

			const { html, metadata } = await renderPageContent(input.markdown);
			const expiresAt =
				input.expiresAtMs === null
					? null
					: parseExpiresAtOrThrow(input.expiresAtMs);

			const explicitSlug = input.slug?.trim();
			if (explicitSlug) {
				pageSlugSchema.parse(explicitSlug);
				const exists = await pageRepo.slugExistsForUser(user.id, explicitSlug);
				if (exists) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Slug already exists",
					});
				}
			}

			const slug =
				explicitSlug ||
				(await retryUntil(
					async () => nanoid(4),
					async (candidateSlug) => {
						return !(await pageRepo.slugExistsForUser(user.id, candidateSlug));
					},
				));

			if (!slug) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to generate unique slug after maximum retries",
				});
			}

			const pageId = crypto.randomUUID();
			const title = (metadata.title || "").trim() || slug;
			const description = (metadata.description || "").trim();
			const now = new Date();

			await pageRepo.insert({
				id: pageId,
				userId: user.id,
				slug,
				theme: input.theme,
				expiresAt,
				title,
				description,
				createdAt: now,
				updatedAt: now,
				deletedAt: null,
			});

			const key = `u/${user.id}/${pageId}`;
			await putJsonObject(
				env,
				key,
				{ markdown: input.markdown, html },
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

			return toSummary(user, {
				id: pageId,
				slug,
				title,
				description,
				theme: input.theme,
				expiresAt,
				createdAt: now,
				updatedAt: now,
			});
		},

		async updatePage(input: UpdateManagedPageInput, user: PageOwner) {
			const currentSlug = input.currentSlug.trim();
			const page = await pageRepo.findActiveByUserAndSlug(user.id, currentSlug);
			if (!page) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
			}

			const targetSlug = input.newSlug?.trim() || page.slug;
			pageSlugSchema.parse(targetSlug);
			if (targetSlug !== page.slug) {
				const exists = await pageRepo.slugExistsForUser(user.id, targetSlug);
				if (exists) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Slug already exists",
					});
				}
			}

			const { html, metadata } = await renderPageContent(input.markdown);
			const nextTheme =
				input.theme ?? (page.theme as z.infer<typeof themeSchema>);
			const nextExpiresAt =
				input.expiresAtMs === undefined
					? page.expiresAt
					: input.expiresAtMs === null
						? null
						: parseExpiresAtOrThrow(input.expiresAtMs);
			const nextTitle = (metadata.title || "").trim() || targetSlug;
			const nextDescription = (metadata.description || "").trim();

			await pageRepo.updateById(page.id, {
				slug: targetSlug,
				theme: nextTheme,
				title: nextTitle,
				description: nextDescription,
				expiresAt: nextExpiresAt,
			});

			const key = `u/${user.id}/${page.id}`;
			await putJsonObject(
				env,
				key,
				{ markdown: input.markdown, html },
				{
					theme: nextTheme,
					lang: metadata.lang || "",
					title: nextTitle,
					description: nextDescription,
					hasCodeBlock: metadata.hasCodeBlock,
					hasKatex: metadata.hasKatex,
					hasMermaid: metadata.hasMermaid,
					hasWikiLink: metadata.hasWikiLink,
				},
			).catch(async (error: unknown) => {
				await pageRepo.updateById(page.id, {
					slug: page.slug,
					theme: page.theme,
					title: page.title,
					description: page.description,
					expiresAt: page.expiresAt,
				});
				throw error;
			});

			const updatedPage = await pageRepo.findActiveByUserAndSlug(
				user.id,
				targetSlug,
			);
			if (!updatedPage) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Updated page not found",
				});
			}

			return {
				page: toSummary(user, updatedPage),
				previousSlug: page.slug,
			};
		},

		async deletePage(userId: string, pageId: string) {
			const page = await findOwnedPageByIdOrThrow(userId, pageId);
			await pageRepo.softDelete(page.id, new Date());
			return { ok: true as const, slug: page.slug };
		},

		async deletePageBySlug(userId: string, slug: string) {
			const page = await pageRepo.findActiveByUserAndSlug(userId, slug);
			if (!page) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
			}

			await pageRepo.softDelete(page.id, new Date());
			return { ok: true as const, slug: page.slug };
		},

		async changeSlug(user: PageOwner, pageId: string, slug: string) {
			const page = await pageRepo.findActiveById(pageId);
			if (!page) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			if (page.userId !== user.id) {
				throw new TRPCError({ code: "FORBIDDEN" });
			}

			if (page.slug !== slug) {
				const exists = await pageRepo.slugExistsForUser(user.id, slug);
				if (exists) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Slug already exists",
					});
				}

				await pageRepo.updateSlug(pageId, slug);
			}

			return {
				ok: true as const,
				slug,
				path: `/${user.name}/${slug}`,
				previousSlug: page.slug,
			};
		},
	};
}
