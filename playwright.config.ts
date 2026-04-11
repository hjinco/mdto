import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:4173";

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
			name: "chromium",
			use: {
				browserName: "chromium",
				headless: true,
				viewport: {
					width: 1280,
					height: 900,
				},
			},
		},
	],
	webServer: [
		{
			command:
				"pnpm generate:themes && vite --host 127.0.0.1 --port 4173 --strictPort",
			url: baseURL,
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
		},
		{
			command:
				"VITE_PUBLIC_TURNSTILE_SITE_KEY='' VITE_PUBLIC_POSTHOG_HOST='' VITE_PUBLIC_POSTHOG_KEY='' pnpm build && pnpm exec wrangler dev --ip 127.0.0.1 --port 8787 --local --log-level error --var BETTER_AUTH_URL:http://127.0.0.1:4173 --var TURNSTILE_SECRET_KEY:dummy-turnstile-secret --var BETTER_AUTH_SECRET:dummy-better-auth-secret-32chars --var GITHUB_CLIENT_ID:dummy-github-client-id --var GITHUB_CLIENT_SECRET:dummy-github-client-secret",
			url: "http://127.0.0.1:8787",
			env: {
				...process.env,
				ENV: "dev",
				BETTER_AUTH_URL: baseURL,
			},
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
		},
	],
});
