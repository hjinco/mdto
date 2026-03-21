import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { page } from "./page-schema";

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull().unique(),
	isDashboardPublic: integer("is_dashboard_public", { mode: "boolean" })
		.default(false)
		.notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" })
		.default(false)
		.notNull(),
	image: text("image"),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const session = sqliteTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		token: text("token").notNull().unique(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: integer("access_token_expires_at", {
			mode: "timestamp_ms",
		}),
		refreshTokenExpiresAt: integer("refresh_token_expires_at", {
			mode: "timestamp_ms",
		}),
		scope: text("scope"),
		password: text("password"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const apikey = sqliteTable(
	"apikey",
	{
		id: text("id").primaryKey(),
		configId: text("config_id").default("default").notNull(),
		name: text("name"),
		start: text("start"),
		referenceId: text("reference_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		prefix: text("prefix"),
		key: text("key").notNull(),
		refillInterval: integer("refill_interval"),
		refillAmount: integer("refill_amount"),
		lastRefillAt: integer("last_refill_at", { mode: "timestamp_ms" }),
		enabled: integer("enabled", { mode: "boolean" }).default(true).notNull(),
		rateLimitEnabled: integer("rate_limit_enabled", { mode: "boolean" })
			.default(true)
			.notNull(),
		rateLimitTimeWindow: integer("rate_limit_time_window")
			.default(1000 * 60 * 60 * 24)
			.notNull(),
		rateLimitMax: integer("rate_limit_max").default(10).notNull(),
		requestCount: integer("request_count").default(0).notNull(),
		remaining: integer("remaining"),
		lastRequest: integer("last_request", { mode: "timestamp_ms" }),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		permissions: text("permissions"),
		metadata: text("metadata"),
	},
	(table) => [
		index("apikey_configId_idx").on(table.configId),
		index("apikey_key_idx").on(table.key),
		index("apikey_referenceId_idx").on(table.referenceId),
	],
);

export const oauthClient = sqliteTable(
	"oauth_client",
	{
		id: text("id").primaryKey(),
		clientId: text("client_id").notNull().unique(),
		clientSecret: text("client_secret"),
		disabled: integer("disabled", { mode: "boolean" }).default(false).notNull(),
		skipConsent: integer("skip_consent", { mode: "boolean" })
			.default(false)
			.notNull(),
		enableEndSession: integer("enable_end_session", { mode: "boolean" })
			.default(false)
			.notNull(),
		subjectType: text("subject_type"),
		scopes: text("scopes", { mode: "json" }).$type<string[]>(),
		userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		name: text("name"),
		uri: text("uri"),
		icon: text("icon"),
		contacts: text("contacts", { mode: "json" }).$type<string[]>(),
		tos: text("tos"),
		policy: text("policy"),
		softwareId: text("software_id"),
		softwareVersion: text("software_version"),
		softwareStatement: text("software_statement"),
		redirectUris: text("redirect_uris", { mode: "json" })
			.$type<string[]>()
			.notNull(),
		postLogoutRedirectUris: text("post_logout_redirect_uris", {
			mode: "json",
		}).$type<string[]>(),
		tokenEndpointAuthMethod: text("token_endpoint_auth_method"),
		grantTypes: text("grant_types", { mode: "json" }).$type<string[]>(),
		responseTypes: text("response_types", { mode: "json" }).$type<string[]>(),
		public: integer("public", { mode: "boolean" }).default(false).notNull(),
		type: text("type"),
		requirePKCE: integer("require_pkce", { mode: "boolean" }),
		referenceId: text("reference_id"),
		metadata: text("metadata", { mode: "json" }).$type<
			Record<string, unknown>
		>(),
	},
	(table) => [
		index("oauth_client_clientId_idx").on(table.clientId),
		index("oauth_client_userId_idx").on(table.userId),
		index("oauth_client_referenceId_idx").on(table.referenceId),
	],
);

export const oauthRefreshToken = sqliteTable(
	"oauth_refresh_token",
	{
		id: text("id").primaryKey(),
		token: text("token").notNull().unique(),
		clientId: text("client_id")
			.notNull()
			.references(() => oauthClient.clientId, { onDelete: "cascade" }),
		sessionId: text("session_id").references(() => session.id, {
			onDelete: "set null",
		}),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		referenceId: text("reference_id"),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		revoked: integer("revoked", { mode: "timestamp_ms" }),
		authTime: integer("auth_time", { mode: "timestamp_ms" }),
		scopes: text("scopes", { mode: "json" }).$type<string[]>().notNull(),
	},
	(table) => [
		index("oauth_refresh_token_token_idx").on(table.token),
		index("oauth_refresh_token_clientId_idx").on(table.clientId),
		index("oauth_refresh_token_sessionId_idx").on(table.sessionId),
		index("oauth_refresh_token_userId_idx").on(table.userId),
	],
);

export const oauthAccessToken = sqliteTable(
	"oauth_access_token",
	{
		id: text("id").primaryKey(),
		token: text("token").notNull().unique(),
		clientId: text("client_id")
			.notNull()
			.references(() => oauthClient.clientId, { onDelete: "cascade" }),
		sessionId: text("session_id").references(() => session.id, {
			onDelete: "set null",
		}),
		userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
		referenceId: text("reference_id"),
		refreshId: text("refresh_id").references(() => oauthRefreshToken.id, {
			onDelete: "set null",
		}),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		scopes: text("scopes", { mode: "json" }).$type<string[]>().notNull(),
	},
	(table) => [
		index("oauth_access_token_token_idx").on(table.token),
		index("oauth_access_token_clientId_idx").on(table.clientId),
		index("oauth_access_token_sessionId_idx").on(table.sessionId),
		index("oauth_access_token_userId_idx").on(table.userId),
		index("oauth_access_token_refreshId_idx").on(table.refreshId),
	],
);

export const oauthConsent = sqliteTable(
	"oauth_consent",
	{
		id: text("id").primaryKey(),
		clientId: text("client_id")
			.notNull()
			.references(() => oauthClient.clientId, { onDelete: "cascade" }),
		userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
		referenceId: text("reference_id"),
		scopes: text("scopes", { mode: "json" }).$type<string[]>().notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("oauth_consent_clientId_idx").on(table.clientId),
		index("oauth_consent_userId_idx").on(table.userId),
		index("oauth_consent_referenceId_idx").on(table.referenceId),
	],
);

export const jwks = sqliteTable("jwks", {
	id: text("id").primaryKey(),
	publicKey: text("public_key").notNull(),
	privateKey: text("private_key").notNull(),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
});

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	apiKeys: many(apikey),
	oauthClients: many(oauthClient),
	oauthRefreshTokens: many(oauthRefreshToken),
	oauthAccessTokens: many(oauthAccessToken),
	oauthConsents: many(oauthConsent),
	pages: many(page),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const apikeyRelations = relations(apikey, ({ one }) => ({
	user: one(user, {
		fields: [apikey.referenceId],
		references: [user.id],
	}),
}));

export const oauthClientRelations = relations(oauthClient, ({ one, many }) => ({
	user: one(user, {
		fields: [oauthClient.userId],
		references: [user.id],
	}),
	accessTokens: many(oauthAccessToken),
	refreshTokens: many(oauthRefreshToken),
	consents: many(oauthConsent),
}));

export const oauthRefreshTokenRelations = relations(
	oauthRefreshToken,
	({ one, many }) => ({
		client: one(oauthClient, {
			fields: [oauthRefreshToken.clientId],
			references: [oauthClient.clientId],
		}),
		session: one(session, {
			fields: [oauthRefreshToken.sessionId],
			references: [session.id],
		}),
		user: one(user, {
			fields: [oauthRefreshToken.userId],
			references: [user.id],
		}),
		accessTokens: many(oauthAccessToken),
	}),
);

export const oauthAccessTokenRelations = relations(
	oauthAccessToken,
	({ one }) => ({
		client: one(oauthClient, {
			fields: [oauthAccessToken.clientId],
			references: [oauthClient.clientId],
		}),
		session: one(session, {
			fields: [oauthAccessToken.sessionId],
			references: [session.id],
		}),
		user: one(user, {
			fields: [oauthAccessToken.userId],
			references: [user.id],
		}),
		refreshToken: one(oauthRefreshToken, {
			fields: [oauthAccessToken.refreshId],
			references: [oauthRefreshToken.id],
		}),
	}),
);

export const oauthConsentRelations = relations(oauthConsent, ({ one }) => ({
	client: one(oauthClient, {
		fields: [oauthConsent.clientId],
		references: [oauthClient.clientId],
	}),
	user: one(user, {
		fields: [oauthConsent.userId],
		references: [user.id],
	}),
}));
