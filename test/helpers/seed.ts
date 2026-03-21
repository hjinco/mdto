import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../server/db/schema";
import type { auth } from "../../server/lib/auth";

export const testUser = {
	id: "user_1",
	name: "tester",
	email: "tester@example.com",
};

export const testPage = {
	id: "page_1",
	slug: "abcd",
	theme: "default" as const,
	title: "Hello",
	description: "Test page",
};

export type AuthSession = typeof auth.$Infer.Session;

export function createTestDb(db: D1Database) {
	return drizzle(db, { schema });
}

export async function resetData(db: ReturnType<typeof createTestDb>) {
	await db.delete(schema.page);
	await db.delete(schema.oauthAccessToken);
	await db.delete(schema.oauthRefreshToken);
	await db.delete(schema.oauthConsent);
	await db.delete(schema.oauthClient);
	await db.delete(schema.apikey);
	await db.delete(schema.account);
	await db.delete(schema.session);
	await db.delete(schema.jwks);
	await db.delete(schema.verification);
	await db.delete(schema.user);
}

export async function seedUser(
	db: ReturnType<typeof createTestDb>,
	input?: { isDashboardPublic?: boolean },
) {
	const now = new Date();
	await db.insert(schema.user).values({
		id: testUser.id,
		name: testUser.name,
		isDashboardPublic: input?.isDashboardPublic ?? false,
		email: testUser.email,
		emailVerified: false,
		createdAt: now,
		updatedAt: now,
	});
}

export async function seedUserWith(
	db: ReturnType<typeof createTestDb>,
	user: {
		id: string;
		name: string;
		email: string;
		isDashboardPublic?: boolean;
	},
) {
	const now = new Date();
	await db.insert(schema.user).values({
		id: user.id,
		name: user.name,
		isDashboardPublic: user.isDashboardPublic ?? false,
		email: user.email,
		emailVerified: false,
		createdAt: now,
		updatedAt: now,
	});
}

export async function seedPage(db: ReturnType<typeof createTestDb>) {
	const now = new Date();
	await db.insert(schema.page).values({
		id: testPage.id,
		userId: testUser.id,
		slug: testPage.slug,
		theme: testPage.theme,
		title: testPage.title,
		description: testPage.description,
		expiresAt: null,
		createdAt: now,
		updatedAt: now,
		deletedAt: null,
	});
}

export async function seedPageForUser(
	db: ReturnType<typeof createTestDb>,
	input: {
		id: string;
		userId: string;
		slug: string;
		theme?: typeof testPage.theme;
		title?: string;
		description?: string;
		expiresAt?: Date | null;
		deletedAt?: Date | null;
	},
) {
	const now = new Date();
	await db.insert(schema.page).values({
		id: input.id,
		userId: input.userId,
		slug: input.slug,
		theme: input.theme ?? testPage.theme,
		title: input.title ?? testPage.title,
		description: input.description ?? testPage.description,
		expiresAt: input.expiresAt ?? null,
		createdAt: now,
		updatedAt: now,
		deletedAt: input.deletedAt ?? null,
	});
}

export async function seedPagesForUser(
	db: ReturnType<typeof createTestDb>,
	userId: string,
	count: number,
) {
	for (let index = 0; index < count; index += 1) {
		const suffix = `${index + 1}`;
		await seedPageForUser(db, {
			id: `page_${userId}_${suffix}`,
			userId,
			slug: `p${suffix}`,
			title: `Title ${suffix}`,
			description: `Description ${suffix}`,
		});
	}
}

export function createMockSession(user: {
	id: string;
	name: string;
	email: string;
}): AuthSession {
	const now = new Date();
	const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

	return {
		session: {
			id: `session_${user.id}`,
			createdAt: now,
			updatedAt: now,
			userId: user.id,
			expiresAt,
			token: `token_${user.id}`,
			ipAddress: null,
			userAgent: null,
		},
		user: {
			id: user.id,
			createdAt: now,
			updatedAt: now,
			email: user.email,
			emailVerified: false,
			name: user.name,
			image: null,
		},
	};
}

export async function seedSessionForUser(
	db: ReturnType<typeof createTestDb>,
	user: {
		id: string;
	},
	input?: {
		id?: string;
		expiresAt?: Date;
		token?: string;
	},
) {
	const now = new Date();
	const expiresAt =
		input?.expiresAt ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
	const sessionId = input?.id ?? `session_${user.id}`;
	await db.insert(schema.session).values({
		id: sessionId,
		userId: user.id,
		token: input?.token ?? `token_${sessionId}`,
		ipAddress: null,
		userAgent: null,
		createdAt: now,
		updatedAt: now,
		expiresAt,
	});

	return {
		id: sessionId,
		expiresAt,
	};
}

export async function seedOauthClient(
	db: ReturnType<typeof createTestDb>,
	input: {
		clientId: string;
		userId: string;
		disabled?: boolean;
		redirectUris?: string[];
	},
) {
	const now = new Date();
	await db.insert(schema.oauthClient).values({
		id: `oauth_client_${input.clientId}`,
		clientId: input.clientId,
		userId: input.userId,
		disabled: input.disabled ?? false,
		redirectUris: input.redirectUris ?? ["https://example.com/callback"],
		createdAt: now,
		updatedAt: now,
	});

	return {
		clientId: input.clientId,
	};
}
