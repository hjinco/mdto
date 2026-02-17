import notFoundPage from "@shared/templates/not-found.html";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";
import { cleanerJob } from "./jobs/cleaner.job";
import { sendDiscordAlert } from "./lib/discord";
import { authRouter } from "./routes/auth.route";
import { dashboardRouter } from "./routes/dashboard.route";
import { viewRouter } from "./routes/view.route";
import { createContext } from "./trpc/context";
import { appRouter } from "./trpc/router";
import { isDev } from "./utils/env";

const app = new Hono<{ Bindings: Env }>();

app.route("/api", authRouter);
app.all("/api/trpc/*", async (c) => {
	return await fetchRequestHandler({
		endpoint: "/api/trpc",
		req: c.req.raw,
		router: appRouter,
		createContext: () =>
			createContext({
				req: c.req.raw,
				env: c.env,
			}),
		onError({ error, path }) {
			console.error("tRPC error", { path, error });
			if (isDev(c.env)) return;
			c.executionCtx.waitUntil(
				sendDiscordAlert(c.env, {
					path,
					message: error.message,
					stack: error.stack,
					timestamp: new Date().toISOString(),
				}),
			);
		},
	});
});
app.route("/", dashboardRouter);
app.route("/", viewRouter);

app.notFound((c) => {
	return c.html(notFoundPage, 404);
});

app.onError((err, c) => {
	console.error("Unhandled error:", err);
	if (!isDev(c.env)) {
		c.executionCtx.waitUntil(
			sendDiscordAlert(c.env, {
				path: c.req.path,
				message: err instanceof Error ? err.message : String(err),
				stack: err instanceof Error ? err.stack : undefined,
				timestamp: new Date().toISOString(),
			}),
		);
	}
	return c.text("Internal server error", 500);
});

export default {
	fetch: app.fetch,
	scheduled: cleanerJob,
} satisfies ExportedHandler<Env>;
