import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

function getLocalD1DB() {
	try {
		const basePath = path.resolve(".wrangler/state/v3/d1");
		const dbFile = fs
			.readdirSync(basePath, { encoding: "utf-8", recursive: true })
			.find((f) => f.endsWith(".sqlite"));

		if (!dbFile) {
			throw new Error(`.sqlite file not found in ${basePath}`);
		}

		const url = path.resolve(basePath, dbFile);
		return url;
	} catch (err) {
		console.log(`Error  ${err.message}`);
	}
}

export default defineConfig({
	dialect: "sqlite",
	schema: "./server/db/schema.ts",
	out: "./migrations",
	dbCredentials: {
		url: getLocalD1DB() ?? "",
	},
});
