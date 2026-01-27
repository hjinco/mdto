import { db } from "@server/db/client";
import {
	createUploadService,
	expirationDaysSchema,
	themeSchema,
} from "@server/services/upload.service";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

export const uploadRouter = router({
	publicCreate: publicProcedure
		.input(
			z.object({
				markdown: z.string(),
				expirationDays: expirationDaysSchema,
				theme: themeSchema.default("default"),
				turnstileToken: z.string().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const uploadService = createUploadService({
				env: ctx.env,
				req: ctx.req,
				db,
			});
			return uploadService.publicCreate(input);
		}),

	userCreate: protectedProcedure
		.input(
			z.object({
				markdown: z.string(),
				theme: themeSchema.default("default"),
				expiresAtMs: z.number().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const uploadService = createUploadService({
				env: ctx.env,
				req: ctx.req,
				db,
			});
			return uploadService.userCreate(input, ctx.session.user);
		}),
});
