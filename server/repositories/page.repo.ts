import { and, desc, eq, isNull, lte, sql } from "drizzle-orm";
import type { db as dbType } from "../db/client";
import * as schema from "../db/schema";

type Db = typeof dbType;

type PageInsert = typeof schema.page.$inferInsert;

export function createPageRepo(db: Db) {
	return {
		async listByUser(userId: string) {
			return db
				.select({
					id: schema.page.id,
					slug: schema.page.slug,
					title: schema.page.title,
					description: schema.page.description,
					expiresAt: schema.page.expiresAt,
					createdAt: schema.page.createdAt,
				})
				.from(schema.page)
				.where(
					and(eq(schema.page.userId, userId), isNull(schema.page.deletedAt)),
				)
				.orderBy(desc(schema.page.createdAt))
				.limit(30)
				.all();
		},
		async findActiveById(pageId: string) {
			const [page] = await db
				.select({
					id: schema.page.id,
					userId: schema.page.userId,
					slug: schema.page.slug,
				})
				.from(schema.page)
				.where(and(eq(schema.page.id, pageId), isNull(schema.page.deletedAt)))
				.limit(1)
				.all();
			return page ?? null;
		},
		async findActiveByUserAndSlug(userId: string, slug: string) {
			const [page] = await db
				.select({
					id: schema.page.id,
					theme: schema.page.theme,
					expiresAt: schema.page.expiresAt,
					title: schema.page.title,
					description: schema.page.description,
				})
				.from(schema.page)
				.where(
					and(
						eq(schema.page.userId, userId),
						eq(schema.page.slug, slug),
						isNull(schema.page.deletedAt),
					),
				)
				.limit(1)
				.all();
			return page ?? null;
		},
		async countActiveByUser(userId: string) {
			const rows = await db
				.select({ count: sql<number>`count(*)`.as("count") })
				.from(schema.page)
				.where(
					and(eq(schema.page.userId, userId), isNull(schema.page.deletedAt)),
				)
				.limit(1)
				.all();
			return Number(rows[0]?.count ?? 0);
		},
		async slugExistsForUser(userId: string, slug: string) {
			const rows = await db
				.select({ id: schema.page.id })
				.from(schema.page)
				.where(
					and(
						eq(schema.page.userId, userId),
						eq(schema.page.slug, slug),
						isNull(schema.page.deletedAt),
					),
				)
				.limit(1)
				.all();
			return rows.length > 0;
		},
		async insert(values: PageInsert) {
			await db.insert(schema.page).values(values);
		},
		async updateSlug(pageId: string, slug: string) {
			await db
				.update(schema.page)
				.set({ slug })
				.where(eq(schema.page.id, pageId));
		},
		async softDelete(pageId: string, deletedAt: Date) {
			await db
				.update(schema.page)
				.set({ deletedAt })
				.where(eq(schema.page.id, pageId));
		},
		async deleteById(pageId: string) {
			await db.delete(schema.page).where(eq(schema.page.id, pageId));
		},
		async softDeleteExpired(now: Date) {
			await db
				.update(schema.page)
				.set({ deletedAt: now })
				.where(
					and(
						isNull(schema.page.deletedAt),
						sql`${schema.page.expiresAt} is not null`,
						lte(schema.page.expiresAt, now),
					),
				);
		},
	};
}
