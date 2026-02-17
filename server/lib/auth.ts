import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import * as schema from "../db/schema";
import { findAvailableUsername } from "./username";

async function isUserNameTaken(name: string): Promise<boolean> {
	const existing = await db
		.select({ id: schema.user.id })
		.from(schema.user)
		.where(eq(schema.user.name, name))
		.limit(1)
		.all();

	return existing.length > 0;
}

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: {
			...schema,
		},
	}),
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					const candidate = await findAvailableUsername(
						user.name,
						isUserNameTaken,
					);
					return {
						data: {
							...user,
							name: candidate,
						},
					};
				},
			},
		},
	},
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID,
			clientSecret: process.env.GITHUB_CLIENT_SECRET,
			mapProfileToUser: async (profile) => {
				return {
					name: profile.login.toLocaleLowerCase(),
				};
			},
		},
	},
	trustedOrigins: [new URL(env.BETTER_AUTH_URL).origin],
});
