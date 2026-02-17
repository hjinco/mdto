import { Hono } from "hono";

export const dashboardRouter = new Hono<{ Bindings: Env }>();

dashboardRouter.get("/:username", async (c) => {
	return c.env.ASSETS.fetch(
		new Request(new URL("/index.html", c.req.url).toString(), c.req.raw),
	);
});
