import { TRPCError } from "@trpc/server";
import type { z } from "zod";
import type { db as dbType } from "../db/client";
import { createPageRepo } from "../repositories/page.repo";
import { createUserRepo } from "../repositories/user.repo";
import type { themeSchema } from "./page-content.service";

type Db = typeof dbType;

export function createPageQueryService({ db }: { db: Db }) {
	const pageRepo = createPageRepo(db);
	const userRepo = createUserRepo(db);

	return {
		async listPublicByUsername(rawUsername: string) {
			const username = rawUsername.trim().toLowerCase();
			const user = await userRepo.findByName(username);

			if (!user || !user.isDashboardPublic) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
			}

			const pages = await pageRepo.listActiveByUser(user.id, new Date());

			return pages.map((page) => ({
				id: page.id,
				slug: page.slug,
				path: `/${user.name}/${page.slug}`,
				title: page.title,
				description: page.description,
				theme: page.theme as z.infer<typeof themeSchema>,
				expiresAt: page.expiresAt ? page.expiresAt.toISOString() : null,
				createdAt: page.createdAt.toISOString(),
				updatedAt: page.updatedAt.toISOString(),
			}));
		},
	};
}
