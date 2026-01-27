import notFoundPage from "@shared/templates/not-found.html";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";
import { cleanerJob } from "./jobs/cleaner.job";
import { authRouter } from "./routes/auth.route";
import { viewRouter } from "./routes/view.route";
import { createContext } from "./trpc/context";
import { appRouter } from "./trpc/router";

const app = new Hono<{ Bindings: Env }>();

app.route("/api", authRouter);
app.all("/api/trpc/*", async (c) => {
	return await fetchRequestHandler({
		endpoint: "/api/trpc",
		req: c.req.raw,
		router: appRouter,
		createContext: () => createContext({ req: c.req.raw, env: c.env }),
		onError({ error, path }) {
			console.error("tRPC error", { path, error });
		},
	});
});
app.route("/", viewRouter);

app.notFound((c) => {
	return c.html(notFoundPage, 404);
});

app.onError((err, c) => {
	console.error("Unhandled error:", err);
	return c.text("Internal server error", 500);
});

export default {
	fetch: app.fetch,
	scheduled: cleanerJob,
} satisfies ExportedHandler<Env>;
