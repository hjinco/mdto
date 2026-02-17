import { Hono } from "hono";

export const dashboardRouter = new Hono<{ Bindings: Env }>();

dashboardRouter.get("/:username", async (c) => {
	return c.env.ASSETS.fetch("http://localhost/dashboard/index.html");
});
