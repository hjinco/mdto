import { Hono } from "hono";
import { auth } from "../lib/auth";

export const authRouter = new Hono<{ Bindings: Env }>();

authRouter.on(["POST", "GET"], "/auth/*", (c) => {
	return auth.handler(c.req.raw);
});
