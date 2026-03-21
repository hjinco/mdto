import "./helpers/mock-iso-language";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import * as schema from "../server/db/schema";
import { seedUser, testUser } from "./helpers/seed";
import { registerWorkersTestHooks, testDb } from "./helpers/workers";

registerWorkersTestHooks({ seedBaseUsers: false });

describe("oauth auth schema json columns", () => {
	it("round-trips oauth arrays and metadata through drizzle", async () => {
		await seedUser(testDb);

		await testDb.insert(schema.oauthClient).values({
			id: "client_1",
			clientId: "client-id-1",
			clientSecret: "secret",
			userId: testUser.id,
			scopes: ["openid", "profile", "mdto:pages:read"],
			contacts: ["ops@example.com"],
			redirectUris: ["https://example.com/callback"],
			postLogoutRedirectUris: ["https://example.com/logout"],
			grantTypes: ["authorization_code", "refresh_token"],
			responseTypes: ["code"],
			metadata: {
				label: "example-client",
			},
		});

		await testDb.insert(schema.oauthRefreshToken).values({
			id: "refresh_1",
			token: "refresh-token-1",
			clientId: "client-id-1",
			userId: testUser.id,
			expiresAt: new Date("2026-12-31T00:00:00.000Z"),
			scopes: ["offline_access", "mdto:pages:read"],
		});

		await testDb.insert(schema.oauthAccessToken).values({
			id: "access_1",
			token: "access-token-1",
			clientId: "client-id-1",
			userId: testUser.id,
			refreshId: "refresh_1",
			expiresAt: new Date("2026-12-31T00:00:00.000Z"),
			scopes: ["mdto:pages:read"],
		});

		await testDb.insert(schema.oauthConsent).values({
			id: "consent_1",
			clientId: "client-id-1",
			userId: testUser.id,
			scopes: ["openid", "profile"],
		});

		const [oauthClient] = await testDb
			.select()
			.from(schema.oauthClient)
			.where(eq(schema.oauthClient.clientId, "client-id-1"));
		const [refreshToken] = await testDb
			.select()
			.from(schema.oauthRefreshToken)
			.where(eq(schema.oauthRefreshToken.id, "refresh_1"));
		const [accessToken] = await testDb
			.select()
			.from(schema.oauthAccessToken)
			.where(eq(schema.oauthAccessToken.id, "access_1"));
		const [consent] = await testDb
			.select()
			.from(schema.oauthConsent)
			.where(eq(schema.oauthConsent.id, "consent_1"));

		expect(oauthClient?.scopes).toEqual([
			"openid",
			"profile",
			"mdto:pages:read",
		]);
		expect(oauthClient?.contacts).toEqual(["ops@example.com"]);
		expect(oauthClient?.redirectUris).toEqual(["https://example.com/callback"]);
		expect(oauthClient?.postLogoutRedirectUris).toEqual([
			"https://example.com/logout",
		]);
		expect(oauthClient?.grantTypes).toEqual([
			"authorization_code",
			"refresh_token",
		]);
		expect(oauthClient?.responseTypes).toEqual(["code"]);
		expect(oauthClient?.metadata).toEqual({
			label: "example-client",
		});
		expect(refreshToken?.scopes).toEqual(["offline_access", "mdto:pages:read"]);
		expect(accessToken?.scopes).toEqual(["mdto:pages:read"]);
		expect(consent?.scopes).toEqual(["openid", "profile"]);
	});
});
