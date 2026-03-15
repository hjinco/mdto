import "./helpers/mock-iso-language";
import { describe, expect, it } from "vitest";
import { issueApiKey, pagesApiFetch } from "./helpers/page-api";
import {
	type ApiErrorResponse,
	buildPageMarkdown,
	daysFromNow,
	getPageById,
	getStoredPageObject,
	type PageSummary,
} from "./helpers/page-api-fixtures";
import { seedPage, seedPageForUser, testPage, testUser } from "./helpers/seed";
import { otherUser, registerWorkersTestHooks, testDb } from "./helpers/workers";

registerWorkersTestHooks();

describe("/api/v1/pages update", () => {
	it("PUT /:id returns 401 when x-api-key is missing", async () => {
		await seedPage(testDb);

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			`/${testPage.id}`,
			{
				method: "PUT",
				body: JSON.stringify({
					markdown: buildPageMarkdown({
						title: "Updated Title",
						description: "Updated Description",
					}),
				}),
			},
		);

		expect(status).toBe(401);
		expect(body).toEqual({ message: "Unauthorized" });
	});

	it("PUT /:id returns 400 for malformed request bodies", async () => {
		await seedPage(testDb);
		const apiKey = await issueApiKey(testUser.id, "bad-put-body-key");

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			`/${testPage.id}`,
			{
				method: "PUT",
				body: "{",
				headers: {
					"content-type": "application/json",
				},
			},
			apiKey.key,
		);

		expect(status).toBe(400);
		expect(body).toEqual({ message: "Invalid request body" });
	});

	it("PUT /:id returns 404 for an unknown page id", async () => {
		const apiKey = await issueApiKey(testUser.id, "missing-page-key");

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			"/missing-page",
			{
				method: "PUT",
				body: JSON.stringify({
					markdown: buildPageMarkdown({
						title: "Updated Title",
						description: "Updated Description",
					}),
				}),
			},
			apiKey.key,
		);

		expect(status).toBe(404);
		expect(body).toEqual({ message: "Not found" });
	});

	it("PUT /:id returns 403 for another user's page", async () => {
		await seedPageForUser(testDb, {
			id: "page_other_put",
			userId: otherUser.id,
			slug: "other-put",
		});
		const apiKey = await issueApiKey(testUser.id, "forbidden-put-key");

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			"/page_other_put",
			{
				method: "PUT",
				body: JSON.stringify({
					markdown: buildPageMarkdown({
						title: "Updated Title",
						description: "Updated Description",
					}),
				}),
			},
			apiKey.key,
		);

		expect(status).toBe(403);
		expect(body).toEqual({ message: "Forbidden" });
	});

	it("PUT /:id returns 409 when the new slug is already used", async () => {
		await seedPage(testDb);
		await seedPageForUser(testDb, {
			id: "page_dup_put",
			userId: testUser.id,
			slug: "taken-slug",
		});
		const apiKey = await issueApiKey(testUser.id, "slug-conflict-put-key");

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			`/${testPage.id}`,
			{
				method: "PUT",
				body: JSON.stringify({
					markdown: buildPageMarkdown({
						title: "Updated Title",
						description: "Updated Description",
					}),
					newSlug: "taken-slug",
				}),
			},
			apiKey.key,
		);

		expect(status).toBe(409);
		expect(body).toEqual({ message: "Slug already exists" });
	});

	it("PUT /:id returns 400 for invalid slug updates", async () => {
		await seedPage(testDb);
		const apiKey = await issueApiKey(testUser.id, "invalid-slug-put-key");

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			`/${testPage.id}`,
			{
				method: "PUT",
				body: JSON.stringify({
					markdown: buildPageMarkdown({
						title: "Updated Title",
						description: "Updated Description",
					}),
					newSlug: "bad/slug",
				}),
			},
			apiKey.key,
		);

		expect(status).toBe(400);
		expect(body.message).toContain("Invalid");
	});

	it("PUT /:id returns 400 for invalid expiresAtMs updates", async () => {
		await seedPage(testDb);
		const apiKey = await issueApiKey(testUser.id, "invalid-expiry-put-key");

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			`/${testPage.id}`,
			{
				method: "PUT",
				body: JSON.stringify({
					markdown: buildPageMarkdown({
						title: "Updated Title",
						description: "Updated Description",
					}),
					expiresAtMs: Date.now() - 1,
				}),
			},
			apiKey.key,
		);

		expect(status).toBe(400);
		expect(body.message).toContain("Invalid expiresAt");
	});

	it("PUT /:id updates the page and stored R2 payload", async () => {
		await seedPage(testDb);
		const apiKey = await issueApiKey(testUser.id, "successful-put-key");
		const markdown = buildPageMarkdown({
			title: "Updated Title",
			description: "Updated Description",
			body: "Updated body",
		});
		const expiresAtMs = daysFromNow(14);

		const { status, body } = await pagesApiFetch<PageSummary>(
			`/${testPage.id}`,
			{
				method: "PUT",
				body: JSON.stringify({
					markdown,
					newSlug: "updated-slug",
					theme: "resume",
					expiresAtMs,
				}),
			},
			apiKey.key,
		);

		expect(status).toBe(200);
		expect(body).toMatchObject({
			id: testPage.id,
			slug: "updated-slug",
			path: `/${testUser.name}/updated-slug`,
			title: "Updated Title",
			description: "Updated Description",
			theme: "resume",
		});
		expect(body.expiresAt).toEqual(expect.any(String));

		const page = await getPageById(testPage.id);
		expect(page).toMatchObject({
			id: testPage.id,
			slug: "updated-slug",
			theme: "resume",
			title: "Updated Title",
			description: "Updated Description",
		});

		const object = await getStoredPageObject(testUser.id, testPage.id);
		expect(object?.customMetadata).toMatchObject({
			theme: "resume",
			title: "Updated Title",
			description: "Updated Description",
		});
		expect(
			await object?.json<{ html: string; markdown: string }>(),
		).toMatchObject({
			markdown,
			html: expect.stringContaining("<h1"),
		});
	});
});
