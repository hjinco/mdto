import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { getObject } from "../infra/r2";
import { createPageAssetRepo } from "../repositories/page-asset.repo";
import { getAssetR2Key } from "../services/local-image-assets.service";

type AssetsApp = {
	Bindings: Env;
};

export const assetsRouter = new Hono<AssetsApp>();

assetsRouter.get("/assets/*", async (c) => {
	const assetId = c.req.path.slice("/assets/".length);
	if (!assetId || assetId.includes("/")) {
		return c.text("Not found", 404);
	}

	const db = drizzle(c.env.DB);
	const pageAssetRepo = createPageAssetRepo(db);
	const asset = await pageAssetRepo.findActiveById(assetId, new Date());
	if (!asset) {
		return c.text("Not found", 404);
	}

	const object = await getObject(c.env, getAssetR2Key(assetId));
	if (!object) {
		return c.text("Not found", 404);
	}

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set("etag", object.httpEtag);
	headers.set("cache-control", "public, max-age=31536000, immutable");
	return new Response(object.body, { headers });
});
