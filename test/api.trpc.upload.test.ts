import { applyD1Migrations, env } from "cloudflare:test";
import { eq, sql } from "drizzle-orm";
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
import * as r2 from "../server/infra/r2";
import * as turnstile from "../server/infra/turnstile";
import { auth } from "../server/lib/auth";
import * as envUtils from "../server/utils/env";
import {
	createMockSession,
	resetData,
	seedPagesForUser,
	seedUser,
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

async function countPagesByUser(userId: string) {
	const rows = await db
		.select({ count: sql<number>`count(*)`.as("count") })
		.from(schema.page)
		.where(eq(schema.page.userId, userId))
		.limit(1)
		.all();
	return Number(rows[0]?.count ?? 0);
}

describe("/api/trpc upload router", () => {
	beforeAll(async () => {
		// @ts-expect-error - test migrations binding
		await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
	});

	beforeEach(async () => {
		await resetData(db);
		await seedUser(db);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("publicCreate rejects empty markdown", async () => {
		await expect(
			trpc.upload.publicCreate.mutate({
				markdown: "   ",
				expirationDays: 1,
				theme: "default",
				turnstileToken: null,
			}),
		).rejects.toThrow(/Markdown content is required/);
	});

	it("publicCreate rejects markdown larger than 100KB", async () => {
		const markdown = "a".repeat(100_001);
		await expect(
			trpc.upload.publicCreate.mutate({
				markdown,
				expirationDays: 1,
				theme: "default",
				turnstileToken: null,
			}),
		).rejects.toThrow(/File size exceeds 100KB limit/);
	});

	it("publicCreate enforces Turnstile outside dev", async () => {
		vi.spyOn(envUtils, "isDev").mockReturnValue(false);
		vi.spyOn(turnstile, "validateTurnstile").mockResolvedValue({
			success: false,
			"error-codes": ["invalid-input-response"],
		});

		await expect(
			trpc.upload.publicCreate.mutate({
				markdown: "# Hello world",
				expirationDays: 1,
				theme: "default",
				turnstileToken: "bad-token",
			}),
		).rejects.toThrow(/Invalid verification/);
	});

	it("userCreate rejects when unauthenticated", async () => {
		await expect(
			trpc.upload.userCreate.mutate({
				markdown: "# User upload",
				theme: "default",
				expiresAtMs: null,
			}),
		).rejects.toThrow(/UNAUTHORIZED/);
	});

	it("userCreate succeeds for an authenticated user", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);

		const result = await trpc.upload.userCreate.mutate({
			markdown: "# User upload",
			theme: "default",
			expiresAtMs: null,
		});

		expect(result.path.startsWith(`${testUser.name}/`)).toBe(true);
		const count = await countPagesByUser(testUser.id);
		expect(count).toBe(1);
	});

	it("userCreate rejects invalid expiresAtMs values", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);

		const now = Date.now();
		await expect(
			trpc.upload.userCreate.mutate({
				markdown: "# Invalid expiresAt",
				theme: "default",
				expiresAtMs: now - 1,
			}),
		).rejects.toThrow(/Invalid expiresAt/);

		await expect(
			trpc.upload.userCreate.mutate({
				markdown: "# Invalid expiresAt",
				theme: "default",
				expiresAtMs: now + 2 * 24 * 60 * 60 * 1000,
			}),
		).rejects.toThrow(/Invalid expiresAt/);
	});

	it("userCreate enforces the 10 active pages limit", async () => {
		await seedPagesForUser(db, testUser.id, 10);
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);

		await expect(
			trpc.upload.userCreate.mutate({
				markdown: "# Over quota",
				theme: "default",
				expiresAtMs: null,
			}),
		).rejects.toThrow(/Upload limit reached/);
	});

	it("userCreate rolls back the DB insert if R2 upload fails", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);
		vi.spyOn(r2, "putJsonObject").mockRejectedValueOnce(
			new Error("R2 failure"),
		);

		await expect(
			trpc.upload.userCreate.mutate({
				markdown: "# R2 failure",
				theme: "default",
				expiresAtMs: null,
			}),
		).rejects.toThrow(/R2 failure/);

		const count = await countPagesByUser(testUser.id);
		expect(count).toBe(0);
	});
});
