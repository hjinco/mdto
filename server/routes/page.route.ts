import { and, desc, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import * as schema from "../db/schema";
import { auth } from "../lib/auth";

export const pageRouter = new Hono<{ Bindings: Env }>();

/**
 * Handle GET /u/pages request (authenticated)
 * Returns pages created by the current user.
 */
pageRouter.get("/pages", async (c) => {
	const session = await auth.api.getSession(c.req.raw);
	if (!session) {
		return c.text("Unauthorized", 401);
	}

	const userId = session.user.id;
	const username = session.user.name;

	const pages = await db
		.select({
			id: schema.page.id,
			slug: schema.page.slug,
			title: schema.page.title,
			description: schema.page.description,
			expiresAt: schema.page.expiresAt,
			createdAt: schema.page.createdAt,
		})
		.from(schema.page)
		.where(and(eq(schema.page.userId, userId), isNull(schema.page.deletedAt)))
		.orderBy(desc(schema.page.createdAt))
		.limit(30)
		.all();

	return c.json({
		pages: pages.map((p) => ({ ...p, path: `/${username}/${p.slug}` })),
	});
});

/**
 * Handle DELETE /pages/:id request (authenticated)
 * Soft-deletes a page owned by the current user
 */
pageRouter.delete("/pages/:id", async (c) => {
	const session = await auth.api.getSession(c.req.raw);
	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const userId = session.user.id;
	const pageId = c.req.param("id");

	const [page] = await db
		.select({ id: schema.page.id, userId: schema.page.userId })
		.from(schema.page)
		.where(and(eq(schema.page.id, pageId), isNull(schema.page.deletedAt)))
		.limit(1)
		.all();

	if (!page) {
		return c.json({ error: "Not found" }, 404);
	}

	if (page.userId !== userId) {
		return c.json({ error: "Forbidden" }, 403);
	}

	await db
		.update(schema.page)
		.set({ deletedAt: new Date() })
		.where(eq(schema.page.id, pageId));

	return c.json({ ok: true });
});
