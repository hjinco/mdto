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
	await db.delete(schema.user);
}

export async function seedUser(db: ReturnType<typeof createTestDb>) {
	const now = new Date();
	await db.insert(schema.user).values({
		id: testUser.id,
		name: testUser.name,
		email: testUser.email,
		emailVerified: false,
		createdAt: now,
		updatedAt: now,
	});
}

export async function seedUserWith(
	db: ReturnType<typeof createTestDb>,
	user: { id: string; name: string; email: string },
) {
	const now = new Date();
	await db.insert(schema.user).values({
		id: user.id,
		name: user.name,
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
