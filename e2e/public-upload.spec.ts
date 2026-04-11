import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const fixturePath = fileURLToPath(
	new URL("./fixtures/sample.md", import.meta.url),
);
const rawMarkdown = `# Sample Title

This is a Playwright smoke test document.

- alpha
- beta

\`\`\`ts
console.log("hello from playwright");
\`\`\`
`;

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		window.localStorage.setItem("mdto.lang", "en");
	});
});

test("home smoke shows upload controls in the initial state", async ({
	page,
}) => {
	await page.goto("/");

	await expect(page.getByTestId("upload-file-input")).toBeAttached();
	await expect(page.getByTestId("upload-preview-button")).toBeDisabled();
	await expect(page.getByTestId("upload-create-button")).toBeDisabled();
});

test("preview opens and closes for an uploaded markdown file", async ({
	page,
}) => {
	await page.goto("/");
	await page.getByTestId("upload-file-input").setInputFiles(fixturePath);

	await expect(page.getByText("sample.md")).toBeVisible();

	await page.getByTestId("upload-preview-button").click();

	const previewFrame = page.frameLocator(
		'[data-testid="preview-iframe-wrapper"] iframe',
	);
	await expect(page.getByTestId("preview-iframe-wrapper")).toBeVisible();
	await expect(previewFrame.locator("h1")).toHaveText("Sample Title");
	await expect(
		previewFrame.getByText("This is a Playwright smoke test document."),
	).toBeVisible();

	await page.getByTestId("upload-preview-button").click();
	await expect(page.getByTestId("preview-iframe-wrapper")).not.toBeVisible();
});

test("anonymous upload creates a public page and exposes the raw markdown", async ({
	page,
}) => {
	await page.goto("/");
	await page.getByTestId("upload-file-input").setInputFiles(fixturePath);
	await page.getByRole("button", { name: "GitHub" }).click();

	await page.getByTestId("upload-create-button").click();
	await expect(page.getByTestId("anonymous-warning-dialog")).toBeVisible();

	await page.getByTestId("warning-confirm-button").click();

	const successUrlInput = page.getByTestId("success-url-input");
	await expect(successUrlInput).toBeVisible();
	const successUrl = await successUrlInput.inputValue();

	const url = new URL(successUrl);
	expect(url.origin).toBe(new URL(page.url()).origin);
	expect(url.pathname).toMatch(/^\/(1|7|E|1E)\/[A-Za-z0-9_-]{5}$/);
	await expect(page.getByTestId("success-open-link")).toHaveAttribute(
		"href",
		successUrl,
	);

	await page.goto(successUrl);
	await expect(page.locator("body")).toHaveClass(/theme-github/);
	await expect(page.locator('link[href="/themes/github.css"]')).toHaveCount(1);
	await expect(
		page.getByRole("heading", { level: 1, name: "Sample Title" }),
	).toBeVisible();
	await expect(
		page.getByText("This is a Playwright smoke test document."),
	).toBeVisible();

	const rawResponse = await page.request.get(`${successUrl}.md`);
	expect(rawResponse.ok()).toBeTruthy();
	expect(rawResponse.headers()["content-type"]).toContain("text/markdown");
	const rawBody = await rawResponse.text();
	expect(rawBody).toBe(rawMarkdown);
});
