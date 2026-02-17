import { z } from "zod";
import { db } from "../../db/client";
import { createPageService } from "../../services/page.service";
import { protectedProcedure, publicProcedure, router } from "../trpc";

export const pageRouter = router({
	listByUsername: publicProcedure
		.input(
			z.object({
				username: z
					.string()
					.min(3)
					.max(32)
					.regex(/^[a-zA-Z0-9_-]+$/),
			}),
		)
		.query(async ({ input }) => {
			const pageService = createPageService({ db });
			return pageService.listPublicByUsername(input.username);
		}),

	list: protectedProcedure.query(async ({ ctx }) => {
		const pageService = createPageService({ db });
		return pageService.list(ctx.session.user);
	}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const pageService = createPageService({ db });
			return pageService.deletePage(ctx.session.user.id, input.id);
		}),

	changeSlug: protectedProcedure
		.input(
			z.object({
				id: z.string().min(1),
				slug: z
					.string()
					.min(1)
					.max(64)
					.regex(/^[a-zA-Z0-9_-]+$/),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const pageService = createPageService({ db });
			return pageService.changeSlug(ctx.session.user, input.id, input.slug);
		}),
});
