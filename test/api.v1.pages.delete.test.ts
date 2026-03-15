import "./helpers/mock-iso-language";
import { describe, expect, it } from "vitest";
import { issueApiKey, pagesApiFetch } from "./helpers/page-api";
import {
	type ApiErrorResponse,
	type DeletePageResponse,
	getPageById,
	type PageSummary,
} from "./helpers/page-api-fixtures";
import { seedPage, seedPageForUser, testPage, testUser } from "./helpers/seed";
import { otherUser, registerWorkersTestHooks, testDb } from "./helpers/workers";

registerWorkersTestHooks();

describe("/api/v1/pages delete", () => {
	it("DELETE /:id returns 401 when x-api-key is missing", async () => {
		await seedPage(testDb);

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			`/${testPage.id}`,
			{
				method: "DELETE",
			},
		);

		expect(status).toBe(401);
		expect(body).toEqual({ message: "Unauthorized" });
	});

	it("DELETE /:id returns 404 for an unknown page id", async () => {
		const apiKey = await issueApiKey(testUser.id, "missing-delete-key");

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			"/missing-page",
			{
				method: "DELETE",
			},
			apiKey.key,
		);

		expect(status).toBe(404);
		expect(body).toEqual({ message: "Not found" });
	});

	it("DELETE /:id returns 403 for another user's page", async () => {
		await seedPageForUser(testDb, {
			id: "page_other_delete",
			userId: otherUser.id,
			slug: "other-delete",
		});
		const apiKey = await issueApiKey(testUser.id, "forbidden-delete-key");

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			"/page_other_delete",
			{
				method: "DELETE",
			},
			apiKey.key,
		);

		expect(status).toBe(403);
		expect(body).toEqual({ message: "Forbidden" });
	});

	it("DELETE /:id soft deletes the page and removes it from the owner's list", async () => {
		await seedPage(testDb);
		const apiKey = await issueApiKey(testUser.id, "successful-delete-key");

		const beforeDelete = await pagesApiFetch<PageSummary[]>("", {}, apiKey.key);
		expect(beforeDelete.status).toBe(200);
		expect(beforeDelete.body).toHaveLength(1);

		const { status, body } = await pagesApiFetch<DeletePageResponse>(
			`/${testPage.id}`,
			{
				method: "DELETE",
			},
			apiKey.key,
		);

		expect(status).toBe(200);
		expect(body).toEqual({
			ok: true,
			slug: testPage.slug,
		});

		const page = await getPageById(testPage.id);
		expect(page?.deletedAt).not.toBeNull();

		const afterDelete = await pagesApiFetch<PageSummary[]>("", {}, apiKey.key);
		expect(afterDelete.status).toBe(200);
		expect(afterDelete.body).toEqual([]);
	});
});
