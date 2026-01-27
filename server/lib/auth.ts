import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/client";
import * as schema from "../db/schema";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: {
			...schema,
		},
	}),
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
			mapProfileToUser: async (profile) => {
				return {
					name: profile.login,
				};
			},
		},
	},
	trustedOrigins: [new URL(env.BETTER_AUTH_URL).origin],
});
