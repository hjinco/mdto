import { applyD1Migrations, env, fetchMock } from "cloudflare:test";
import { afterEach, beforeAll, beforeEach, vi } from "vitest";
import { createTestDb, resetData, seedUser, seedUserWith } from "./seed";

export const testDb = createTestDb(env.DB);

export const otherUser = {
	id: "user_2",
	name: "other",
	email: "other@example.com",
};

function mockDiscordWebhook() {
	fetchMock
		.get("https://discord.test")
		.intercept({
			method: "POST",
			path: "/webhook",
		})
		.reply(204, "")
		.persist();
}

export function registerWorkersTestHooks(input?: { seedBaseUsers?: boolean }) {
	const seedBaseUsers = input?.seedBaseUsers ?? true;

	beforeAll(async () => {
		// @ts-expect-error - test migrations binding
		await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
	});

	beforeEach(async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		fetchMock.activate();
		fetchMock.disableNetConnect();
		mockDiscordWebhook();

		await resetData(testDb);
		if (!seedBaseUsers) return;

		await seedUser(testDb);
		await seedUserWith(testDb, otherUser);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		fetchMock.deactivate();
	});
}
