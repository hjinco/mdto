import "./helpers/mock-iso-language";
import { describe, expect, it, vi } from "vitest";
import { auth } from "../server/lib/auth";
import { issueApiKey, pagesApiFetch } from "./helpers/page-api";
import type {
	ApiErrorResponse,
	PageSummary,
} from "./helpers/page-api-fixtures";
import { seedPage, seedPageForUser, testPage, testUser } from "./helpers/seed";
import { otherUser, registerWorkersTestHooks, testDb } from "./helpers/workers";

registerWorkersTestHooks();

describe("/api/v1/pages auth and list", () => {
	it("GET / returns 401 when x-api-key is missing", async () => {
		const { status, body } = await pagesApiFetch<ApiErrorResponse>();

		expect(status).toBe(401);
		expect(body).toEqual({ message: "Unauthorized" });
	});

	it("GET / returns 401 for an invalid API key", async () => {
		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			"",
			{},
			"bad-key",
		);

		expect(status).toBe(401);
		expect(body).toEqual({ message: "Unauthorized" });
	});

	it("GET / returns 401 when the API key points to a missing user", async () => {
		const apiKey = await issueApiKey(testUser.id, "orphaned-key");
		vi.spyOn(auth.api, "verifyApiKey").mockResolvedValueOnce({
			valid: true,
			error: null,
			key: {
				referenceId: "ghost_user",
			},
		} as Awaited<ReturnType<typeof auth.api.verifyApiKey>>);

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			"",
			{},
			apiKey.key,
		);

		expect(status).toBe(401);
		expect(body).toEqual({ message: "Unauthorized" });
	});

	it("GET / returns only active pages owned by the API key user", async () => {
		await seedPage(testDb);
		await seedPageForUser(testDb, {
			id: "page_deleted",
			userId: testUser.id,
			slug: "deleted-slug",
			deletedAt: new Date(),
		});
		await seedPageForUser(testDb, {
			id: "page_other",
			userId: otherUser.id,
			slug: "other-slug",
		});
		const apiKey = await issueApiKey(testUser.id, "list-key");

		const { status, body } = await pagesApiFetch<PageSummary[]>(
			"",
			{},
			apiKey.key,
		);

		expect(status).toBe(200);
		expect(body).toHaveLength(1);
		expect(body[0]).toMatchObject({
			id: testPage.id,
			slug: testPage.slug,
			path: `/${testUser.name}/${testPage.slug}`,
			title: testPage.title,
			description: testPage.description,
			theme: testPage.theme,
			expiresAt: null,
		});
		expect(body[0]?.createdAt).toEqual(expect.any(String));
		expect(body[0]?.updatedAt).toEqual(expect.any(String));
	});

	it("returns 500 when API key verification throws unexpectedly", async () => {
		await seedPage(testDb);
		const apiKey = await issueApiKey(testUser.id, "verify-throws-key");
		vi.spyOn(auth.api, "verifyApiKey").mockRejectedValueOnce(new Error("boom"));

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			"",
			{},
			apiKey.key,
		);

		expect(status).toBe(500);
		expect(body).toEqual({ message: "Internal server error" });
	});
});
