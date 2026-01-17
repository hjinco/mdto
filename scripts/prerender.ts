import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

async function prerender() {
	const { render } = await import(
		resolve(root, "dist-ssr/assets/entry-server.js")
	);

	const template = readFileSync(resolve(root, "public/index.html"), "utf-8");

	const appHtml = render();

	const html = template.replace("<!--ssr-outlet-->", appHtml);

	writeFileSync(resolve(root, "public/index.html"), html);

	console.log("✓ Prerendered public/index.html");
}

prerender().catch((err) => {
	console.error("Prerender failed:", err);
	process.exit(1);
});
