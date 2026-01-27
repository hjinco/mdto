import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "../lib/auth";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
	errorFormatter({ shape, error }) {
		const isInternal = error.code === "INTERNAL_SERVER_ERROR";
		return {
			...shape,
			message: isInternal ? "Internal server error" : shape.message,
			data: {
				...shape.data,
				stack: undefined,
			},
		};
	},
});

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceAuthed = t.middleware(async ({ ctx, next }) => {
	const session = await auth.api.getSession(ctx.req);
	if (!session) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	return next({
		ctx: {
			...ctx,
			session,
		},
	});
});

export const protectedProcedure = t.procedure.use(enforceAuthed);
