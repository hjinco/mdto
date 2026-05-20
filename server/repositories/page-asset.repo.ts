import { and, eq, gt, isNull, or } from "drizzle-orm";
import type { db as dbType } from "../db/client";
import * as schema from "../db/schema";

type Db = typeof dbType;
type PageAssetInsert = typeof schema.pageAsset.$inferInsert;

export function createPageAssetRepo(db: Db) {
	return {
		async insertMany(values: PageAssetInsert[]) {
			if (values.length === 0) return;
			await db.insert(schema.pageAsset).values(values);
		},
		async listIdsByPageId(pageId: string) {
			return db
				.select({ id: schema.pageAsset.id })
				.from(schema.pageAsset)
				.where(eq(schema.pageAsset.pageId, pageId))
				.all();
		},
		async findActiveById(assetId: string, now: Date) {
			const [asset] = await db
				.select({
					id: schema.pageAsset.id,
					contentType: schema.pageAsset.contentType,
				})
				.from(schema.pageAsset)
				.innerJoin(schema.page, eq(schema.pageAsset.pageId, schema.page.id))
				.where(
					and(
						eq(schema.pageAsset.id, assetId),
						isNull(schema.page.deletedAt),
						or(isNull(schema.page.expiresAt), gt(schema.page.expiresAt, now)),
					),
				)
				.limit(1)
				.all();
			return asset ?? null;
		},
	};
}
