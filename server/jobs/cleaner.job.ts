import { drizzle } from "drizzle-orm/d1";
import { createPageRepo } from "../repositories/page.repo";

export async function cleanerJob(_controller: ScheduledController, env: Env) {
	const db = drizzle(env.DB);
	const nowDate = new Date();
	const pageRepo = createPageRepo(db);

	await pageRepo.softDeleteExpired(nowDate);
}
