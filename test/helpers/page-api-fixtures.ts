import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import * as schema from "../../server/db/schema";
import { DAY_MS } from "../../server/services/page-content.service";
import { testDb } from "./workers";

export type ApiErrorResponse = {
	message: string;
};

export type PageSummary = {
	id: string;
	slug: string;
	path: string;
	title: string;
	description: string;
	theme: "default" | "resume" | "matrix";
	expiresAt: string | null;
	createdAt: string;
	updatedAt: string;
};

export type DeletePageResponse = {
	ok: true;
	slug: string;
};

export function daysFromNow(days: number) {
	return Date.now() + days * DAY_MS;
}

export function buildPageMarkdown({
	title,
	description,
	body,
}: {
	title: string;
	description: string;
	body?: string;
}) {
	return `---\ntitle: ${title}\ndescription: ${description}\n---\n\n# ${title}\n\n${body ?? "Body copy"}`;
}

export async function getPageById(pageId: string) {
	const rows = await testDb
		.select({
			id: schema.page.id,
			userId: schema.page.userId,
			slug: schema.page.slug,
			theme: schema.page.theme,
			title: schema.page.title,
			description: schema.page.description,
			expiresAt: schema.page.expiresAt,
			deletedAt: schema.page.deletedAt,
		})
		.from(schema.page)
		.where(eq(schema.page.id, pageId))
		.limit(1)
		.all();

	return rows[0] ?? null;
}

export async function getStoredPageObject(userId: string, pageId: string) {
	return env.BUCKET.get(`u/${userId}/${pageId}`);
}
