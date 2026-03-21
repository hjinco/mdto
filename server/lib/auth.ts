import { env } from "cloudflare:workers";
import { apiKey } from "@better-auth/api-key";
import { oauthProvider, type Scope } from "@better-auth/oauth-provider";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import * as schema from "../db/schema";
import { findAvailableUsername } from "./username";

const authOrigin = new URL(env.BETTER_AUTH_URL).origin;
const mcpResourceUrl = `${authOrigin}/mcp`;

const oauthScopes = [
	"openid",
	"profile",
	"email",
	"offline_access",
	"mdto:pages:read",
	"mdto:pages:write",
	"mdto:user:read",
	"mdto:user:write",
] as const satisfies Scope[];

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
	baseURL: env.BETTER_AUTH_URL,
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
	plugins: [
		apiKey({
			configId: "default",
			references: "user",
			requireName: true,
			keyExpiration: {
				defaultExpiresIn: null,
				disableCustomExpiresTime: true,
			},
			rateLimit: {
				enabled: false,
			},
		}),
		jwt({
			disableSettingJwtHeader: true,
			jwt: {
				issuer: `${authOrigin}/api/auth`,
			},
		}),
		oauthProvider({
			loginPage: `${authOrigin}/oauth/login`,
			consentPage: `${authOrigin}/oauth/consent`,
			scopes: [...oauthScopes],
			validAudiences: [mcpResourceUrl],
			grantTypes: ["authorization_code", "refresh_token"],
			allowDynamicClientRegistration: true,
			allowUnauthenticatedClientRegistration: true,
			clientRegistrationDefaultScopes: [...oauthScopes],
			clientRegistrationAllowedScopes: [...oauthScopes],
		}),
	],
	trustedOrigins: [authOrigin],
});
