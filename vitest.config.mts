import path, { resolve } from "node:path";
import {
	defineWorkersConfig,
	readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config";
import { configDefaults } from "vitest/config";

export default defineWorkersConfig(async () => {
	const migrations = await readD1Migrations(path.join(__dirname, "migrations"));

	return {
		resolve: {
			alias: {
				"@server": resolve(__dirname, "./server"),
				"@shared": resolve(__dirname, "./shared"),
			},
		},
		test: {
			exclude: [...configDefaults.exclude, "e2e/**"],
			poolOptions: {
				workers: {
					// Filtered runs intermittently fail in the Cloudflare worker pool
					// with local loopback connection errors unless suites share one worker.
					singleWorker: true,
					miniflare: {
						bindings: {
							DISCORD_WEBHOOK_URL: "https://discord.test/webhook",
							TURNSTILE_SECRET_KEY: "test-turnstile-secret",
							BETTER_AUTH_SECRET: "test-secret",
							BETTER_AUTH_URL: "http://localhost:5173",
							GITHUB_CLIENT_ID: "test-client-id",
							GITHUB_CLIENT_SECRET: "test-client-secret",
							TEST_MIGRATIONS: migrations,
						},
					},
					wrangler: { configPath: "./wrangler.jsonc" },
				},
			},
		},
	};
});
