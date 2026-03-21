import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
	THEME_IDS,
	THEMES,
	type ThemeId,
} from "../shared/themes/theme-registry.ts";

const ROOT_DIR = resolve(import.meta.dirname, "..");
const SOURCE_DIR = resolve(ROOT_DIR, "shared/themes/source");
const OUTPUT_DIR = resolve(ROOT_DIR, "public/themes");

function readFragment(fragmentPath: string): string {
	const sourcePath = resolve(SOURCE_DIR, fragmentPath);
	return readFileSync(sourcePath, "utf-8").trim();
}

function buildAsset(themeId: ThemeId, kind: "theme" | "hljs"): string {
	const theme = THEMES[themeId];
	const fragments =
		kind === "theme" ? theme.themeFragments : theme.hljsFragments;

	const banner =
		kind === "theme"
			? `/* Generated theme bundle for "${themeId}". Do not edit directly. */`
			: `/* Generated highlight theme bundle for "${themeId}". Do not edit directly. */`;

	return `${banner}\n\n${fragments
		.map(
			(fragmentPath) =>
				`/* Source: ${fragmentPath} */\n${readFragment(fragmentPath)}`,
		)
		.join("\n\n")}\n`;
}

export function generateThemes() {
	mkdirSync(OUTPUT_DIR, { recursive: true });

	for (const themeId of THEME_IDS) {
		const themeCssPath = resolve(OUTPUT_DIR, `${themeId}.css`);
		const hljsCssPath = resolve(OUTPUT_DIR, `${themeId}.hljs.css`);

		writeFileSync(themeCssPath, buildAsset(themeId, "theme"));
		writeFileSync(hljsCssPath, buildAsset(themeId, "hljs"));
	}
}

function main() {
	generateThemes();
	console.log(`✓ Generated ${THEME_IDS.length} theme bundles in public/themes`);
}

const isDirectExecution = (() => {
	const entryFromArgv = process.argv[1];
	if (!entryFromArgv) return false;
	return fileURLToPath(import.meta.url) === entryFromArgv;
})();

if (isDirectExecution) {
	main();
}
