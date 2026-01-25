import { and, isNull, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

export async function cleanerJob(_controller: ScheduledController, env: Env) {
	const db = drizzle(env.DB);
	const nowDate = new Date();

	// Soft-delete pages that are expired and still active.
	// - `expiresAt` uses timestamp_ms mode, so comparisons are done with `Date`.
	// - Include `expiresAt is not null` to match the partial index `page_expiresAt_idx`.
	await db
		.update(schema.page)
		.set({ deletedAt: nowDate })
		.where(
			and(
				isNull(schema.page.deletedAt),
				sql`${schema.page.expiresAt} is not null`,
				lte(schema.page.expiresAt, nowDate),
			),
		);
}
