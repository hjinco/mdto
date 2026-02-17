import { z } from "zod";
import { db } from "../../db/client";
import { createUserService } from "../../services/user.service";
import { protectedProcedure, router } from "../trpc";

export const userRouter = router({
	dashboardVisibility: protectedProcedure.query(async ({ ctx }) => {
		const userService = createUserService({ db });
		return userService.getDashboardVisibility(ctx.session.user.id);
	}),

	setDashboardVisibility: protectedProcedure
		.input(
			z.object({
				isDashboardPublic: z.boolean(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userService = createUserService({ db });
			return userService.setDashboardVisibility(
				ctx.session.user.id,
				input.isDashboardPublic,
			);
		}),

	changeName: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userService = createUserService({ db });
			return userService.changeName(ctx.session.user, input.name);
		}),
});
