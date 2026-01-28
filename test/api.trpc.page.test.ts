import { applyD1Migrations, env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import * as schema from "../server/db/schema";
import { auth } from "../server/lib/auth";
import {
	createMockSession,
	resetData,
	seedPage,
	seedPageForUser,
	seedUser,
	seedUserWith,
	testPage,
	testUser,
} from "./helpers/seed";
import { createTrpcClient, setupDb } from "./helpers/trpc";

vi.mock("iso-639-3-to-1", () => {
	return {
		default: (code: string) => {
			if (code === "eng") return "en" as const;
			return undefined;
		},
	};
});

const trpc = createTrpcClient();
const db = setupDb();

const otherUser = {
	id: "user_2",
	name: "other",
	email: "other@example.com",
};

async function getDeletedAtForPage(pageId: string) {
	const rows = await db
		.select({ deletedAt: schema.page.deletedAt })
		.from(schema.page)
		.where(eq(schema.page.id, pageId))
		.limit(1)
		.all();
	return rows[0]?.deletedAt ?? null;
}

async function getSlugForPage(pageId: string) {
	const rows = await db
		.select({ slug: schema.page.slug })
		.from(schema.page)
		.where(eq(schema.page.id, pageId))
		.limit(1)
		.all();
	return rows[0]?.slug ?? null;
}

describe("/api/trpc page router", () => {
	beforeAll(async () => {
		// @ts-expect-error - test migrations binding
		await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
	});

	beforeEach(async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		await resetData(db);
		await seedUser(db);
		await seedUserWith(db, otherUser);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("page.list rejects when unauthenticated", async () => {
		await expect(trpc.page.list.query()).rejects.toThrow(/UNAUTHORIZED/);
	});

	it("page.list only returns pages for the authenticated user", async () => {
		await seedPage(db);
		await seedPageForUser(db, {
			id: "page_other_1",
			userId: otherUser.id,
			slug: "zzzz",
			title: "Other title",
			description: "Other description",
		});
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);

		const pages = await trpc.page.list.query();

		expect(pages).toHaveLength(1);
		expect(pages[0]?.path).toBe(`/${testUser.name}/${testPage.slug}`);
	});

	it("page.delete rejects when unauthenticated", async () => {
		await seedPage(db);
		await expect(trpc.page.delete.mutate({ id: testPage.id })).rejects.toThrow(
			/UNAUTHORIZED/,
		);
	});

	it("page.delete returns NOT_FOUND for an unknown page id", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);

		await expect(
			trpc.page.delete.mutate({ id: "missing-page" }),
		).rejects.toThrow(/Not found/);
	});

	it("page.delete returns FORBIDDEN for another user's page", async () => {
		await seedPageForUser(db, {
			id: "page_other_2",
			userId: otherUser.id,
			slug: "other-slug",
		});
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);

		await expect(
			trpc.page.delete.mutate({ id: "page_other_2" }),
		).rejects.toThrow(/Forbidden/);
	});

	it("page.delete soft deletes the page for the owner", async () => {
		await seedPage(db);
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);

		const result = await trpc.page.delete.mutate({ id: testPage.id });
		expect(result.ok).toBe(true);

		const deletedAt = await getDeletedAtForPage(testPage.id);
		expect(deletedAt).not.toBeNull();
	});

	it("page.changeSlug rejects when unauthenticated", async () => {
		await seedPage(db);
		await expect(
			trpc.page.changeSlug.mutate({ id: testPage.id, slug: "custom-slug" }),
		).rejects.toThrow(/UNAUTHORIZED/);
	});

	it("page.changeSlug returns NOT_FOUND for an unknown page id", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);

		await expect(
			trpc.page.changeSlug.mutate({ id: "missing-page", slug: "custom-slug" }),
		).rejects.toThrow(/NOT_FOUND/);
	});

	it("page.changeSlug returns FORBIDDEN for another user's page", async () => {
		await seedPageForUser(db, {
			id: "page_other_3",
			userId: otherUser.id,
			slug: "other-slug",
		});
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);

		await expect(
			trpc.page.changeSlug.mutate({
				id: "page_other_3",
				slug: "custom-slug",
			}),
		).rejects.toThrow(/FORBIDDEN/);
	});

	it("page.changeSlug returns CONFLICT when slug is already used", async () => {
		await seedPage(db);
		await seedPageForUser(db, {
			id: "page_dupe_1",
			userId: testUser.id,
			slug: "dupe-slug",
		});
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);

		await expect(
			trpc.page.changeSlug.mutate({
				id: testPage.id,
				slug: "dupe-slug",
			}),
		).rejects.toThrow(/Slug already exists/);
	});

	it("page.changeSlug rejects invalid slugs", async () => {
		await seedPage(db);
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);

		await expect(
			trpc.page.changeSlug.mutate({
				id: testPage.id,
				slug: "bad/slug",
			}),
		).rejects.toThrow(/invalid_format/);
	});

	it("page.changeSlug updates the slug for the owner", async () => {
		await seedPage(db);
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);

		const result = await trpc.page.changeSlug.mutate({
			id: testPage.id,
			slug: "custom-slug-123",
		});

		expect(result.ok).toBe(true);
		expect(result.slug).toBe("custom-slug-123");
		expect(result.path).toBe(`/${testUser.name}/custom-slug-123`);

		const slug = await getSlugForPage(testPage.id);
		expect(slug).toBe("custom-slug-123");
	});
});
