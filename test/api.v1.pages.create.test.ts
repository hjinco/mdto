import "./helpers/mock-iso-language";
import { and, eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import * as schema from "../server/db/schema";
import * as r2 from "../server/infra/r2";
import { issueApiKey, pagesApiFetch } from "./helpers/page-api";
import {
	type ApiErrorResponse,
	buildPageMarkdown,
	daysFromNow,
	getPageById,
	getStoredPageObject,
	type PageSummary,
} from "./helpers/page-api-fixtures";
import { seedPage, seedPagesForUser, testPage, testUser } from "./helpers/seed";
import { registerWorkersTestHooks, testDb } from "./helpers/workers";

registerWorkersTestHooks();

describe("/api/v1/pages create", () => {
	it("POST / returns 201, persists the page, and uploads the rendered content", async () => {
		const apiKey = await issueApiKey(testUser.id, "create-key");
		const markdown = buildPageMarkdown({
			title: "Created Title",
			description: "Created Description",
			body: "Created body",
		});
		const expiresAtMs = daysFromNow(7);

		const { status, body } = await pagesApiFetch<PageSummary>(
			"",
			{
				method: "POST",
				body: JSON.stringify({
					markdown,
					slug: "created-page",
					theme: "matrix",
					expiresAtMs,
				}),
			},
			apiKey.key,
		);

		expect(status).toBe(201);
		expect(body).toMatchObject({
			slug: "created-page",
			path: `/${testUser.name}/created-page`,
			title: "Created Title",
			description: "Created Description",
			theme: "matrix",
		});
		expect(body.expiresAt).toEqual(expect.any(String));

		const page = await getPageById(body.id);
		expect(page).toMatchObject({
			id: body.id,
			userId: testUser.id,
			slug: "created-page",
			theme: "matrix",
			title: "Created Title",
			description: "Created Description",
		});

		const object = await getStoredPageObject(testUser.id, body.id);
		expect(object).not.toBeNull();
		expect(object?.httpMetadata?.contentType).toBe("application/json");
		expect(object?.customMetadata).toMatchObject({
			theme: "matrix",
			title: "Created Title",
			description: "Created Description",
		});
		expect(
			await object?.json<{ html: string; markdown: string }>(),
		).toMatchObject({
			markdown,
			html: expect.stringContaining("<h1"),
		});
	});

	it("POST / returns 400 for malformed JSON bodies", async () => {
		const apiKey = await issueApiKey(testUser.id, "malformed-body-key");

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			"",
			{
				method: "POST",
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

	it("POST / returns 400 when required fields are missing", async () => {
		const apiKey = await issueApiKey(testUser.id, "missing-field-key");

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			"",
			{
				method: "POST",
				body: JSON.stringify({
					theme: "default",
				}),
			},
			apiKey.key,
		);

		expect(status).toBe(400);
		expect(body).toEqual({ message: "Invalid request body" });
	});

	it("POST / returns 400 for empty markdown", async () => {
		const apiKey = await issueApiKey(testUser.id, "empty-markdown-key");

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			"",
			{
				method: "POST",
				body: JSON.stringify({
					markdown: "   ",
					theme: "default",
					expiresAtMs: null,
				}),
			},
			apiKey.key,
		);

		expect(status).toBe(400);
		expect(body).toEqual({ message: "Markdown content is required" });
	});

	it("POST / returns 413 when markdown exceeds 100KB", async () => {
		const apiKey = await issueApiKey(testUser.id, "too-large-key");

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			"",
			{
				method: "POST",
				body: JSON.stringify({
					markdown: "a".repeat(100_001),
					theme: "default",
					expiresAtMs: null,
				}),
			},
			apiKey.key,
		);

		expect(status).toBe(413);
		expect(body).toEqual({ message: "File size exceeds 100KB limit" });
	});

	it("POST / returns 400 for an invalid slug", async () => {
		const apiKey = await issueApiKey(testUser.id, "invalid-slug-key");

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			"",
			{
				method: "POST",
				body: JSON.stringify({
					markdown: buildPageMarkdown({
						title: "Invalid Slug",
						description: "Invalid Slug",
					}),
					slug: "bad/slug",
					theme: "default",
					expiresAtMs: null,
				}),
			},
			apiKey.key,
		);

		expect(status).toBe(400);
		expect(body.message).toContain("Invalid");
	});

	it("POST / returns 400 for an invalid expiresAtMs", async () => {
		const apiKey = await issueApiKey(testUser.id, "invalid-expiry-key");

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			"",
			{
				method: "POST",
				body: JSON.stringify({
					markdown: buildPageMarkdown({
						title: "Invalid Expiry",
						description: "Invalid Expiry",
					}),
					theme: "default",
					expiresAtMs: Date.now() - 1,
				}),
			},
			apiKey.key,
		);

		expect(status).toBe(400);
		expect(body.message).toContain("Invalid expiresAt");
	});

	it("POST / returns 409 when the slug already exists for the user", async () => {
		await seedPage(testDb);
		const apiKey = await issueApiKey(testUser.id, "duplicate-slug-key");

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			"",
			{
				method: "POST",
				body: JSON.stringify({
					markdown: buildPageMarkdown({
						title: "Duplicate Slug",
						description: "Duplicate Slug",
					}),
					slug: testPage.slug,
					theme: "default",
					expiresAtMs: null,
				}),
			},
			apiKey.key,
		);

		expect(status).toBe(409);
		expect(body).toEqual({ message: "Slug already exists" });
	});

	it("POST / returns 429 when the user already has 10 active pages", async () => {
		await seedPagesForUser(testDb, testUser.id, 10);
		const apiKey = await issueApiKey(testUser.id, "quota-key");

		const { status, body } = await pagesApiFetch<ApiErrorResponse>(
			"",
			{
				method: "POST",
				body: JSON.stringify({
					markdown: buildPageMarkdown({
						title: "Over Quota",
						description: "Over Quota",
					}),
					theme: "default",
					expiresAtMs: null,
				}),
			},
			apiKey.key,
		);

		expect(status).toBe(429);
		expect(body.message).toContain("Upload limit reached");
	});

	it("POST / rolls back the database insert if the R2 upload fails", async () => {
		const apiKey = await issueApiKey(testUser.id, "r2-failure-key");
		vi.spyOn(r2, "putJsonObject").mockRejectedValueOnce(
			new Error("R2 failure"),
		);

		const { status, body } = await pagesApiFetch<string>(
			"",
			{
				method: "POST",
				body: JSON.stringify({
					markdown: buildPageMarkdown({
						title: "R2 Failure",
						description: "R2 Failure",
					}),
					theme: "default",
					expiresAtMs: null,
				}),
			},
			apiKey.key,
		);

		expect(status).toBe(500);
		expect(body).toBe("Internal server error");

		const rows = await testDb
			.select({ id: schema.page.id })
			.from(schema.page)
			.where(
				and(
					eq(schema.page.userId, testUser.id),
					eq(schema.page.title, "R2 Failure"),
				),
			)
			.limit(1)
			.all();

		expect(rows).toEqual([]);
	});
});
