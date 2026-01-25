import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/client";
import * as schema from "../../db/schema";
import { protectedProcedure, router } from "../trpc";

export const pageRouter = router({
	list: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;
		const username = ctx.session.user.name;

		const pages = await db
			.select({
				id: schema.page.id,
				slug: schema.page.slug,
				title: schema.page.title,
				description: schema.page.description,
				expiresAt: schema.page.expiresAt,
				createdAt: schema.page.createdAt,
			})
			.from(schema.page)
			.where(and(eq(schema.page.userId, userId), isNull(schema.page.deletedAt)))
			.orderBy(desc(schema.page.createdAt))
			.limit(30)
			.all();

		return {
			pages: pages.map((p) => ({
				id: p.id,
				path: `/${username}/${p.slug}`,
				title: p.title,
				description: p.description,
				expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
				createdAt: p.createdAt.toISOString(),
			})),
		};
	}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const pageId = input.id;

			const [page] = await db
				.select({ id: schema.page.id, userId: schema.page.userId })
				.from(schema.page)
				.where(and(eq(schema.page.id, pageId), isNull(schema.page.deletedAt)))
				.limit(1)
				.all();

			if (!page) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
			}

			if (page.userId !== userId) {
				throw new TRPCError({ code: "FORBIDDEN", message: "Forbidden" });
			}

			await db
				.update(schema.page)
				.set({ deletedAt: new Date() })
				.where(eq(schema.page.id, pageId));

			return { ok: true as const };
		}),
});
