import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { expect, test as setup } from "@playwright/test";
import { AUTH_FILE } from "./auth.shared";

const E2E_AUTH_SECRET = "mdto-e2e-auth-secret";

setup("bootstrap authenticated session", async ({ page }) => {
	await mkdir(dirname(AUTH_FILE), { recursive: true });

	const response = await page.request.post("/api/test/login", {
		headers: {
			"x-e2e-auth-secret": E2E_AUTH_SECRET,
		},
		data: {
			name: "playwright-user",
			email: "playwright-user@example.com",
		},
	});

	expect(response.ok()).toBeTruthy();
	const sessionResponse = await page.request.get("/api/test/session", {
		headers: {
			"x-e2e-auth-secret": E2E_AUTH_SECRET,
		},
	});
	expect(sessionResponse.ok()).toBeTruthy();
	const session = await sessionResponse.json();
	expect(session.user.name).toBe("playwright-user");

	await page.context().storageState({ path: AUTH_FILE });
});
