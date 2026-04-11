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
				"pnpm build && pnpm exec wrangler dev --ip 127.0.0.1 --port 8787 --local --log-level error",
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
