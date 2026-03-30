import "./helpers/mock-iso-language";
import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { buildPageMarkdown } from "./helpers/page-api-fixtures";
import { seedPage, testPage, testUser } from "./helpers/seed";
import { workerFetch } from "./helpers/worker-http";
import { registerWorkersTestHooks, testDb } from "./helpers/workers";

registerWorkersTestHooks();

async function clearBucket() {
	let cursor: string | undefined;

	do {
		const result = await env.BUCKET.list({ cursor });
		if (result.objects.length > 0) {
			await Promise.all(
				result.objects.map((object) => env.BUCKET.delete(object.key)),
			);
		}
		cursor = result.truncated ? result.cursor : undefined;
	} while (cursor);
}

async function putPublicPageObject(input: {
	key: string;
	markdown: string;
	html?: string;
}) {
	await env.BUCKET.put(
		input.key,
		JSON.stringify({
			html: input.html ?? "<h1>Public title</h1><p>Public body</p>",
			markdown: input.markdown,
		}),
		{
			httpMetadata: {
				contentType: "application/json",
			},
			customMetadata: {
				theme: "default",
				lang: "en",
				title: "Public title",
				description: "Public description",
				hasCodeBlock: "",
				hasKatex: "",
				hasMermaid: "",
				hasWikiLink: "",
			},
		},
	);
}

async function putUserPageObject(input: {
	userId: string;
	pageId: string;
	markdown: string;
	html?: string;
}) {
	await env.BUCKET.put(
		`u/${input.userId}/${input.pageId}`,
		JSON.stringify({
			html: input.html ?? "<h1>User title</h1><p>User body</p>",
			markdown: input.markdown,
		}),
		{
			httpMetadata: {
				contentType: "application/json",
			},
			customMetadata: {
				lang: "en",
				hasKatex: "",
				hasMermaid: "",
			},
		},
	);
}

beforeEach(async () => {
	await clearBucket();
});

describe("view routes", () => {
	it("returns raw markdown for public .md URLs and honors ETag revalidation", async () => {
		const markdown = buildPageMarkdown({
			title: "Public title",
			description: "Public description",
			body: "Public body",
		});
		await putPublicPageObject({
			key: "1/abcde",
			markdown,
		});

		const first = await workerFetch<string>("https://example.com/1/abcde.md");

		expect(first.status).toBe(200);
		expect(first.body).toBe(markdown);
		expect(first.response.headers.get("content-type")).toContain(
			"text/markdown; charset=utf-8",
		);
		expect(first.response.headers.get("etag")).toEqual(expect.any(String));
		expect(first.body).not.toContain("<h1>");

		const second = await workerFetch<null>("https://example.com/1/abcde.md", {
			headers: {
				"If-None-Match": first.response.headers.get("etag") ?? "",
			},
		});

		expect(second.status).toBe(304);
		expect(second.body).toBeNull();
	});

	it("returns raw markdown for user .md URLs", async () => {
		const markdown = buildPageMarkdown({
			title: "User title",
			description: "User description",
			body: "User body",
		});
		await seedPage(testDb);
		await putUserPageObject({
			userId: testUser.id,
			pageId: testPage.id,
			markdown,
		});

		const response = await workerFetch<string>(
			`https://example.com/${testUser.name}/${testPage.slug}.md`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toBe(markdown);
		expect(response.response.headers.get("content-type")).toContain(
			"text/markdown; charset=utf-8",
		);
		expect(response.response.headers.get("etag")).toEqual(expect.any(String));
		expect(response.body).not.toContain("<h1>");
	});

	it("returns 404 for .md URLs when the stored object has no markdown payload", async () => {
		await env.BUCKET.put("1/abcde", "<h1>legacy html</h1>", {
			httpMetadata: {
				contentType: "text/html",
			},
		});

		const response = await workerFetch<string>(
			"https://example.com/1/abcde.md",
		);

		expect(response.status).toBe(404);
	});

	it("keeps HTML responses unchanged for normal page URLs", async () => {
		const markdown = buildPageMarkdown({
			title: "User title",
			description: "User description",
			body: "User body",
		});
		await seedPage(testDb);
		await putUserPageObject({
			userId: testUser.id,
			pageId: testPage.id,
			markdown,
			html: "<h1>User title</h1><p>User body</p>",
		});

		const htmlResponse = await workerFetch<string>(
			`https://example.com/${testUser.name}/${testPage.slug}`,
		);
		const markdownResponse = await workerFetch<string>(
			`https://example.com/${testUser.name}/${testPage.slug}.md`,
		);

		expect(htmlResponse.status).toBe(200);
		expect(htmlResponse.response.headers.get("content-type")).toContain(
			"text/html",
		);
		expect(htmlResponse.body).toContain("<!DOCTYPE html>");
		expect(htmlResponse.body).toContain("On this page");
		expect(markdownResponse.response.headers.get("etag")).not.toBe(
			htmlResponse.response.headers.get("etag"),
		);
	});

	it("returns 404 for missing HTML and .md page URLs", async () => {
		const htmlResponse = await workerFetch<string>(
			"https://example.com/tester/missing-page",
		);
		const markdownResponse = await workerFetch<string>(
			"https://example.com/tester/missing-page.md",
		);

		expect(htmlResponse.status).toBe(404);
		expect(markdownResponse.status).toBe(404);
	});
});
