import { drizzle } from "drizzle-orm/d1";
import { deleteObjects } from "../infra/r2";
import { createPageRepo } from "../repositories/page.repo";
import { createPageAssetRepo } from "../repositories/page-asset.repo";
import { getAssetR2Key } from "../services/local-image-assets.service";

export async function cleanerJob(_controller: ScheduledController, env: Env) {
	const db = drizzle(env.DB);
	const nowDate = new Date();
	const pageRepo = createPageRepo(db);
	const pageAssetRepo = createPageAssetRepo(db);

	const expiredPages = await pageRepo.softDeleteExpired(nowDate);
	const assetIds = (
		await Promise.all(
			expiredPages.map((page) => pageAssetRepo.listIdsByPageId(page.id)),
		)
	).flat();
	await deleteObjects(
		env,
		assetIds.map((asset) => getAssetR2Key(asset.id)),
	);
}
