import { expect, type Page } from "@playwright/test";

export async function waitForHomeReady(page: Page) {
	await expect(page.getByTestId("home-ready")).toHaveAttribute(
		"data-ready",
		"true",
	);
}
