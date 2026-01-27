import path, { resolve } from "node:path";
import {
	defineWorkersConfig,
	readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig(async () => {
	const migrations = await readD1Migrations(path.join(__dirname, "migrations"));

	return {
		resolve: {
			alias: {
				"@": resolve(__dirname, "./server"),
				"@shared": resolve(__dirname, "./shared"),
			},
		},
		test: {
			poolOptions: {
				workers: {
					miniflare: {
						bindings: {
							ENV: "dev",
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
