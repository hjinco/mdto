import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { auth } from "../lib/auth";
import { createManagedPageService } from "../services/managed-page.service";
import { pageSlugSchema, themeSchema } from "../services/page-content.service";
import { purgePathsFromCache } from "../utils/cache";

const createPageBodySchema = z.object({
	markdown: z.string(),
	slug: pageSlugSchema.optional(),
	theme: themeSchema.default("default"),
	expiresAtMs: z.number().nullable().default(null),
});

const updatePageBodySchema = z.object({
	markdown: z.string(),
	newSlug: pageSlugSchema.optional(),
	theme: themeSchema.optional(),
	expiresAtMs: z.number().nullable().optional(),
});

type ApiPageApp = {
	Bindings: Env;
	Variables: {
		apiKeyUser: {
			id: string;
			name: string;
		};
	};
};

function trpcErrorStatus(code?: string) {
	switch (code) {
		case "BAD_REQUEST":
			return 400;
		case "UNAUTHORIZED":
			return 401;
		case "FORBIDDEN":
			return 403;
		case "NOT_FOUND":
			return 404;
		case "CONFLICT":
			return 409;
		case "TOO_MANY_REQUESTS":
			return 429;
		case "PAYLOAD_TOO_LARGE":
			return 413;
		default:
			return 500;
	}
}

export const pageApiRouter = new Hono<ApiPageApp>();

pageApiRouter.use("*", async (c, next) => {
	const apiKey = c.req.header("x-api-key");
	if (!apiKey) {
		return c.json({ message: "Unauthorized" }, 401);
	}

	try {
		const session = await auth.api.getSession(c.req.raw);
		if (!session) {
			return c.json({ message: "Unauthorized" }, 401);
		}

		c.set("apiKeyUser", {
			id: session.user.id,
			name: session.user.name,
		});
	} catch (error) {
		console.error("Failed to retrieve API key session", error);
		return c.json({ message: "Unauthorized" }, 401);
	}

	await next();
});

pageApiRouter.get("/", async (c) => {
	const user = c.get("apiKeyUser");
	const managedPageService = createManagedPageService({ env: c.env, db });
	const pages = await managedPageService.listForUser(user);
	return c.json(pages);
});

pageApiRouter.post("/", async (c) => {
	const parsed = createPageBodySchema.safeParse(
		await c.req.json().catch(() => null),
	);
	if (!parsed.success) {
		return c.json({ message: "Invalid request body" }, 400);
	}

	try {
		const user = c.get("apiKeyUser");
		const managedPageService = createManagedPageService({ env: c.env, db });
		const page = await managedPageService.createPage(parsed.data, user);
		return c.json(page, 201);
	} catch (error) {
		const typedError = error as { code?: string; message?: string };
		if (typedError?.code) {
			return c.json(
				{ message: typedError.message || "Internal server error" },
				trpcErrorStatus(typedError.code),
			);
		}
		throw error;
	}
});

pageApiRouter.put("/:slug", async (c) => {
	const parsed = updatePageBodySchema.safeParse(
		await c.req.json().catch(() => null),
	);
	if (!parsed.success) {
		return c.json({ message: "Invalid request body" }, 400);
	}

	try {
		const user = c.get("apiKeyUser");
		const managedPageService = createManagedPageService({ env: c.env, db });
		const result = await managedPageService.updatePage(
			{
				currentSlug: c.req.param("slug"),
				...parsed.data,
			},
			user,
		);
		await purgePathsFromCache(c.req.url, [
			`/${user.name}/${result.previousSlug}`,
			result.page.path,
		]);
		return c.json(result.page);
	} catch (error) {
		const typedError = error as { code?: string; message?: string };
		if (typedError?.code) {
			return c.json(
				{ message: typedError.message || "Internal server error" },
				trpcErrorStatus(typedError.code),
			);
		}
		throw error;
	}
});

pageApiRouter.delete("/:slug", async (c) => {
	try {
		const user = c.get("apiKeyUser");
		const managedPageService = createManagedPageService({ env: c.env, db });
		const result = await managedPageService.deletePageBySlug(
			user.id,
			c.req.param("slug"),
		);
		await purgePathsFromCache(c.req.url, [`/${user.name}/${result.slug}`]);
		return c.json(result);
	} catch (error) {
		const typedError = error as { code?: string; message?: string };
		if (typedError?.code) {
			return c.json(
				{ message: typedError.message || "Internal server error" },
				trpcErrorStatus(typedError.code),
			);
		}
		throw error;
	}
});
