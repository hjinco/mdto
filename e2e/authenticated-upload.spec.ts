import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { AUTH_FILE } from "./auth.shared";
import { waitForHomeReady } from "./home.shared";

const fixturePath = fileURLToPath(
	new URL("./fixtures/sample.md", import.meta.url),
);

test.use({ storageState: AUTH_FILE });

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		window.localStorage.setItem("mdto.lang", "en");
	});
});

test("authenticated upload creates a managed page for the logged-in user", async ({
	page,
}) => {
	await page.goto("/");
	await waitForHomeReady(page);

	await expect(page.getByText("playwright-user")).toBeVisible();

	await page.getByTestId("upload-file-input").setInputFiles(fixturePath);
	await expect(page.getByText("sample.md")).toBeVisible();

	await page.getByTestId("upload-create-button").click();

	const successUrlInput = page.getByTestId("success-url-input");
	await expect(successUrlInput).toBeVisible();

	const successUrl = await successUrlInput.inputValue();
	const url = new URL(successUrl);

	expect(url.origin).toBe(new URL(page.url()).origin);
	expect(url.pathname).toMatch(/^\/playwright-user\/[A-Za-z0-9_-]{4}$/);

	await expect(page.getByTestId("success-open-link")).toHaveAttribute(
		"href",
		successUrl,
	);

	await page.goto(successUrl);
	await expect(
		page.getByRole("heading", { level: 1, name: "Sample Title" }),
	).toBeVisible();
});
