import { isNull, relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

export const page = sqliteTable(
	"page",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		slug: text("slug").notNull(),
		theme: text("theme").notNull(),
		title: text("title").notNull(),
		description: text("description").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
	},
	(table) => [
		// Allow slug reuse after soft-delete: only active rows are unique
		uniqueIndex("page_userId_slug_idx")
			.on(table.userId, table.slug)
			.where(isNull(table.deletedAt)),
		// Used by expiry cleanup jobs to scan active, expiring pages efficiently
		index("page_expiresAt_idx")
			.on(table.expiresAt)
			.where(
				sql`${table.deletedAt} is null and ${table.expiresAt} is not null`,
			),
	],
);

export const pageRelations = relations(page, ({ one }) => ({
	user: one(user, {
		fields: [page.userId],
		references: [user.id],
	}),
}));
