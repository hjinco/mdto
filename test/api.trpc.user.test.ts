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

async function getUserNameById(userId: string) {
	const rows = await db
		.select({ name: schema.user.name })
		.from(schema.user)
		.where(eq(schema.user.id, userId))
		.limit(1)
		.all();

	return rows[0]?.name ?? null;
}

async function getDashboardVisibilityById(userId: string) {
	const rows = await db
		.select({ isDashboardPublic: schema.user.isDashboardPublic })
		.from(schema.user)
		.where(eq(schema.user.id, userId))
		.limit(1)
		.all();

	return rows[0]?.isDashboardPublic ?? null;
}

describe("/api/trpc user router", () => {
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

	it("user.changeName rejects when unauthenticated", async () => {
		await expect(
			trpc.user.changeName.mutate({ name: "tester2" }),
		).rejects.toThrow(/UNAUTHORIZED/);
	});

	it("user.dashboardVisibility rejects when unauthenticated", async () => {
		await expect(trpc.user.dashboardVisibility.query()).rejects.toThrow(
			/UNAUTHORIZED/,
		);
	});

	it("user.dashboardVisibility returns current visibility", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);

		const result = await trpc.user.dashboardVisibility.query();

		expect(result.isDashboardPublic).toBe(false);
	});

	it("user.setDashboardVisibility rejects when unauthenticated", async () => {
		await expect(
			trpc.user.setDashboardVisibility.mutate({ isDashboardPublic: true }),
		).rejects.toThrow(/UNAUTHORIZED/);
	});

	it("user.setDashboardVisibility updates visibility in DB", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);

		const result = await trpc.user.setDashboardVisibility.mutate({
			isDashboardPublic: true,
		});

		expect(result.ok).toBe(true);
		expect(result.isDashboardPublic).toBe(true);
		expect(await getDashboardVisibilityById(testUser.id)).toBe(true);
	});

	it("user.changeName rejects invalid usernames", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);

		await expect(
			trpc.user.changeName.mutate({
				name: "ab",
			}),
		).rejects.toThrow(/Username must be 3-32 characters/);

		await expect(
			trpc.user.changeName.mutate({
				name: "bad/name",
			}),
		).rejects.toThrow(/Username must be 3-32 characters/);
	});

	it("user.changeName normalizes uppercase to lowercase", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);

		const result = await trpc.user.changeName.mutate({
			name: "User_Name",
		});

		expect(result.ok).toBe(true);
		expect(result.name).toBe("user_name");
		expect(await getUserNameById(testUser.id)).toBe("user_name");
	});

	it("user.changeName returns CONFLICT when the username is already taken", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);

		await expect(
			trpc.user.changeName.mutate({
				name: otherUser.name,
			}),
		).rejects.toThrow(/Username already exists/);
	});

	it("user.changeName returns CONFLICT when the username is reserved", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);

		await expect(
			trpc.user.changeName.mutate({
				name: "admin",
			}),
		).rejects.toThrow(/Username already exists/);
	});

	it("user.changeName updates username in DB", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue(
			createMockSession(testUser),
		);

		const result = await trpc.user.changeName.mutate({
			name: "new_name",
		});

		expect(result.ok).toBe(true);
		expect(result.name).toBe("new_name");
		expect(await getUserNameById(testUser.id)).toBe("new_name");
	});

	it("page.list uses updated username in returned paths after name change", async () => {
		await seedPage(db);

		vi.spyOn(auth.api, "getSession").mockImplementation(async () => {
			const currentName = await getUserNameById(testUser.id);
			if (!currentName) return null;

			return createMockSession({
				...testUser,
				name: currentName,
			});
		});

		await trpc.user.changeName.mutate({
			name: "renamed_user",
		});

		const pages = await trpc.page.list.query();
		expect(pages).toHaveLength(1);
		expect(pages[0]?.path).toBe(`/renamed_user/${testPage.slug}`);
	});
});
