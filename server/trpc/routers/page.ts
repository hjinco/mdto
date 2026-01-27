import { z } from "zod";
import { db } from "../../db/client";
import { createPageService } from "../../services/page.service";
import { protectedProcedure, router } from "../trpc";

export const pageRouter = router({
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
});
