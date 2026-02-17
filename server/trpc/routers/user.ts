import { z } from "zod";
import { db } from "../../db/client";
import { createUserService } from "../../services/user.service";
import { protectedProcedure, router } from "../trpc";

export const userRouter = router({
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
