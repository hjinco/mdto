import notFoundPage from "@shared/templates/not-found.html";
import { Hono } from "hono";
import { cleanerJob } from "./jobs/cleaner.job";
import { authRouter } from "./routes/auth.route";
import { pageRouter } from "./routes/page.route";
import { uploadRouter } from "./routes/upload.route";
import { viewRouter } from "./routes/view.route";

const app = new Hono<{ Bindings: Env }>();

app.route("/api", authRouter);
app.route("/api", pageRouter);
app.route("/api", uploadRouter);
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
