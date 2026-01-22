import notFoundPage from "@shared/templates/not-found.html";
import { Hono } from "hono";
import { uploadRouter } from "./routes/upload.route";
import { viewRouter } from "./routes/view.route";

const app = new Hono<{ Bindings: Env }>();

app.route("/", uploadRouter);
app.route("/", viewRouter);

app.notFound((c) => {
	return c.html(notFoundPage, 404);
});

app.onError((err, c) => {
	console.error("Unhandled error:", err);
	return c.text("Internal server error", 500);
});

export default app;
