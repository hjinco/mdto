import { Hono } from "hono";

export const oauthUiRouter = new Hono<{ Bindings: Env }>();

oauthUiRouter.get("/oauth/login", async (c) => {
	return c.env.ASSETS.fetch("http://localhost/oauth/login/index.html");
});

oauthUiRouter.get("/oauth/consent", async (c) => {
	return c.env.ASSETS.fetch("http://localhost/oauth/consent/index.html");
});
