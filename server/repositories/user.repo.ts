import { eq } from "drizzle-orm";
import type { db as dbType } from "../db/client";
import * as schema from "../db/schema";

type Db = typeof dbType;

export function createUserRepo(db: Db) {
	return {
		async findByName(name: string) {
			const [user] = await db
				.select({ id: schema.user.id, name: schema.user.name })
				.from(schema.user)
				.where(eq(schema.user.name, name))
				.limit(1)
				.all();
			return user ?? null;
		},
	};
}
