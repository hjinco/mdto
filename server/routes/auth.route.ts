import { Hono } from "hono";
import { auth } from "../lib/auth";

type AuthApp = {
	Bindings: Env;
};

export const authRouter = new Hono<AuthApp>();

authRouter.on(["POST", "GET"], "*", (c) => {
	return auth.handler(c.req.raw);
});
