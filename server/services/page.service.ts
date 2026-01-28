import { TRPCError } from "@trpc/server";
import type { db as dbType } from "../db/client";
import { createPageRepo } from "../repositories/page.repo";

type Db = typeof dbType;

export function createPageService({ db }: { db: Db }) {
	const pageRepo = createPageRepo(db);

	return {
		async list(user: { id: string; name: string }) {
			const pages = await pageRepo.listByUser(user.id);
			return pages.map((page) => ({
				id: page.id,
				path: `/${user.name}/${page.slug}`,
				title: page.title,
				description: page.description,
				expiresAt: page.expiresAt ? page.expiresAt.toISOString() : null,
				createdAt: page.createdAt.toISOString(),
			}));
		},
		async deletePage(userId: string, pageId: string) {
			const page = await pageRepo.findActiveById(pageId);
			if (!page) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
			}

			if (page.userId !== userId) {
				throw new TRPCError({ code: "FORBIDDEN", message: "Forbidden" });
			}

			await pageRepo.softDelete(pageId, new Date());
			return { ok: true as const };
		},
		async changeSlug(
			user: { id: string; name: string },
			pageId: string,
			slug: string,
		) {
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

			return { ok: true as const, slug, path: `/${user.name}/${slug}` };
		},
	};
}
