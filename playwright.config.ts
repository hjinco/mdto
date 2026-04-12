import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:4173";
const clientCommand =
	"VITE_PUBLIC_TURNSTILE_SITE_KEY='' VITE_PUBLIC_POSTHOG_HOST='' VITE_PUBLIC_POSTHOG_KEY='' VITE_PUBLIC_E2E=1 pnpm build && pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort";
const workerBaseCommand =
	"pnpm exec wrangler d1 migrations apply mdto --local && pnpm exec wrangler dev --ip 127.0.0.1 --port 8787 --local --log-level error --var ENV:dev --var BETTER_AUTH_URL:http://127.0.0.1:4173 --var TURNSTILE_SECRET_KEY:dummy-turnstile-secret --var BETTER_AUTH_SECRET:dummy-better-auth-secret-32chars --var GITHUB_CLIENT_ID:dummy-github-client-id --var GITHUB_CLIENT_SECRET:dummy-github-client-secret --var ENABLE_E2E_AUTH:1 --var E2E_AUTH_SECRET:mdto-e2e-auth-secret";
const workerCommand = workerBaseCommand;

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? [["html"], ["github"]] : [["html"], ["list"]],
	use: {
		baseURL,
		trace: "retain-on-failure",
		video: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "setup",
			testMatch: /auth\.setup\.ts/,
		},
		{
			name: "chromium",
			dependencies: ["setup"],
			testIgnore: /auth\.setup\.ts/,
			use: {
				browserName: "chromium",
				headless: true,
				storageState: undefined,
				viewport: {
					width: 1280,
					height: 900,
				},
			},
		},
	],
	webServer: [
		{
			command: clientCommand,
			url: baseURL,
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
		},
		{
			command: workerCommand,
			url: "http://127.0.0.1:8787",
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
		},
	],
});
