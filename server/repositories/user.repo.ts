import { eq } from "drizzle-orm";
import type { db as dbType } from "../db/client";
import * as schema from "../db/schema";

type Db = typeof dbType;

export function createUserRepo(db: Db) {
	return {
		async findById(id: string) {
			const [user] = await db
				.select({ id: schema.user.id, name: schema.user.name })
				.from(schema.user)
				.where(eq(schema.user.id, id))
				.limit(1)
				.all();
			return user ?? null;
		},
		async findByName(name: string) {
			const [user] = await db
				.select({ id: schema.user.id, name: schema.user.name })
				.from(schema.user)
				.where(eq(schema.user.name, name))
				.limit(1)
				.all();
			return user ?? null;
		},
		async updateNameById(id: string, name: string) {
			await db.update(schema.user).set({ name }).where(eq(schema.user.id, id));
		},
	};
}
