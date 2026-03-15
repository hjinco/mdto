import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { createServer } from "vite";
import {
	apiDocsPages,
	getApiDocsAlternateLinks,
	SITE_ORIGIN,
} from "../shared/docs/api-docs.ts";

const ROOT_DIR = resolve(import.meta.dirname, "..");
const DIST_CLIENT_DIR = resolve(ROOT_DIR, "dist/client");
const DIST_DOCS_DIR = resolve(DIST_CLIENT_DIR, "docs");

type RenderApiDocHtml = (input: {
	markdown: string;
	lang: string;
	canonicalUrl: string;
	alternateLinks: Array<{
		hreflang: string;
		href: string;
	}>;
}) => Promise<string>;

async function loadRenderer() {
	const vite = await createServer({
		appType: "custom",
		configFile: false,
		server: {
			middlewareMode: true,
		},
		resolve: {
			alias: {
				"@": resolve(ROOT_DIR, "client"),
				"@shared": resolve(ROOT_DIR, "shared"),
			},
		},
	});

	try {
		const module = (await vite.ssrLoadModule(
			"/shared/docs/api-docs.render.tsx",
		)) as {
			renderApiDocHtml: RenderApiDocHtml;
		};
		return module.renderApiDocHtml;
	} finally {
		await vite.close();
	}
}

export async function generateApiDocs() {
	if (!existsSync(DIST_CLIENT_DIR)) {
		throw new Error(
			`Missing build output at ${DIST_CLIENT_DIR}. Run vite build before generating API docs.`,
		);
	}

	const renderApiDocHtml = await loadRenderer();
	const alternateLinks = getApiDocsAlternateLinks();

	rmSync(DIST_DOCS_DIR, { recursive: true, force: true });

	for (const page of apiDocsPages) {
		const markdown = readFileSync(resolve(ROOT_DIR, page.sourcePath), "utf-8");
		const html = await renderApiDocHtml({
			markdown,
			lang: page.lang,
			canonicalUrl: `${SITE_ORIGIN}${page.publicPath}`,
			alternateLinks,
		});
		const outputPath = resolve(DIST_CLIENT_DIR, page.outputPath);

		mkdirSync(dirname(outputPath), { recursive: true });
		writeFileSync(outputPath, html);
		console.log(`✓ Generated ${page.publicPath}`);
	}
}

async function main() {
	await generateApiDocs();
}

const isDirectExecution = process.argv[1] === import.meta.filename;

if (isDirectExecution) {
	main().catch((error) => {
		console.error("✗ Failed to generate API docs");
		console.error(error);
		process.exit(1);
	});
}
