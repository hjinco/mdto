import { z } from "zod";
import { db } from "../../db/client";
import { createManagedPageService } from "../../services/managed-page.service";
import { createPageQueryService } from "../../services/page-query.service";
import { getViewCachePaths, purgePathsFromCache } from "../../utils/cache";
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
			const pageQueryService = createPageQueryService({ db });
			return pageQueryService.listPublicByUsername(input.username);
		}),

	list: protectedProcedure.query(async ({ ctx }) => {
		const managedPageService = createManagedPageService({ env: ctx.env, db });
		return managedPageService.listForUser(ctx.session.user);
	}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const managedPageService = createManagedPageService({ env: ctx.env, db });
			const result = await managedPageService.deletePage(
				ctx.session.user.id,
				input.id,
			);
			await purgePathsFromCache(ctx.req.url, [
				...getViewCachePaths(`/${ctx.session.user.name}/${result.slug}`),
			]);
			return result;
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
			const managedPageService = createManagedPageService({ env: ctx.env, db });
			const result = await managedPageService.changeSlug(
				ctx.session.user,
				input.id,
				input.slug,
			);
			await purgePathsFromCache(ctx.req.url, [
				...getViewCachePaths(
					`/${ctx.session.user.name}/${result.previousSlug}`,
				),
				...getViewCachePaths(result.path),
			]);
			return result;
		}),
});
