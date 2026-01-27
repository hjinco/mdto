import { z } from "zod";

const envSchema = z
	.object({
		ENV: z.string().min(1),
		TURNSTILE_SECRET_KEY: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(1),
		BETTER_AUTH_URL: z.string().min(1),
		GITHUB_CLIENT_ID: z.string().min(1),
		GITHUB_CLIENT_SECRET: z.string().min(1),
		ASSETS: z.unknown(),
		BUCKET: z.unknown(),
		DB: z.unknown(),
	})
	.loose();

export function validateEnv(env: unknown) {
	return envSchema.parse(env);
}
