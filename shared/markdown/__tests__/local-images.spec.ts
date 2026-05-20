import { describe, expect, it } from "vitest";
import {
	analyzeLocalImageReferences,
	findLocalImageReferences,
	rewriteLocalImageReferences,
} from "../local-images";

describe("local image references", () => {
	it("finds local markdown, html, and wikilink images", () => {
		const references = findLocalImageReferences(`
![Local](./image.png)
![Remote](https://example.com/image.png)
<img src="../assets/photo.webp" />
![[diagram.gif]]
![Duplicate](./image.png)
`);

		expect(references).toEqual([
			{ originalPath: "./image.png", kind: "markdown" },
			{ originalPath: "../assets/photo.webp", kind: "html" },
			{ originalPath: "diagram.gif", kind: "wikilink" },
		]);
	});

	it("rewrites only image reference targets", () => {
		const markdown = `
![Local](./image.png)
Path text: ./image.png
<img src="../assets/photo.webp" />
![[diagram.gif]]
`;
		const replacements = new Map([
			["./image.png", "/assets/u/user/image.png"],
			["../assets/photo.webp", "/assets/u/user/photo.webp"],
			["diagram.gif", "/assets/u/user/diagram.gif"],
		]);
		const analysis = analyzeLocalImageReferences(markdown);
		const rewritten = analysis.rewrite(replacements);

		expect(analysis.references).toEqual([
			{ originalPath: "./image.png", kind: "markdown" },
			{ originalPath: "../assets/photo.webp", kind: "html" },
			{ originalPath: "diagram.gif", kind: "wikilink" },
		]);
		expect(rewriteLocalImageReferences(markdown, replacements)).toBe(rewritten);
		expect(rewritten).toContain("![Local](/assets/u/user/image.png)");
		expect(rewritten).toContain("Path text: ./image.png");
		expect(rewritten).toContain('<img src="/assets/u/user/photo.webp" />');
		expect(rewritten).toContain("![](/assets/u/user/diagram.gif)");
	});

	it("rewrites markdown image URLs when alt text contains matching text", () => {
		const markdown = [
			"![see (./image.png)](./image.png)",
			"![path ./photo.webp](<./photo.webp>)",
		].join("\n");

		const rewritten = rewriteLocalImageReferences(
			markdown,
			new Map([
				["./image.png", "/assets/u/user/image.png"],
				["./photo.webp", "/assets/u/user/photo.webp"],
			]),
		);

		expect(rewritten).toContain(
			"![see (./image.png)](/assets/u/user/image.png)",
		);
		expect(rewritten).toContain(
			"![path ./photo.webp](</assets/u/user/photo.webp>)",
		);
	});

	it("ignores image-looking text inside code", () => {
		const markdown = [
			"![Local](./image.png)",
			"",
			"`![Inline](./inline.png)`",
			"",
			"```md",
			"![Code](./code.png)",
			'<img src="./code-html.png" />',
			"![[code-wiki.gif]]",
			"```",
		].join("\n");

		const references = findLocalImageReferences(markdown);
		expect(references).toEqual([
			{ originalPath: "./image.png", kind: "markdown" },
		]);

		const rewritten = rewriteLocalImageReferences(
			markdown,
			new Map([
				["./image.png", "/assets/u/user/image.png"],
				["./inline.png", "/assets/u/user/inline.png"],
				["./code.png", "/assets/u/user/code.png"],
				["./code-html.png", "/assets/u/user/code-html.png"],
				["code-wiki.gif", "/assets/u/user/code-wiki.gif"],
			]),
		);

		expect(rewritten).toContain("![Local](/assets/u/user/image.png)");
		expect(rewritten).toContain("`![Inline](./inline.png)`");
		expect(rewritten).toContain("![Code](./code.png)");
		expect(rewritten).toContain('<img src="./code-html.png" />');
		expect(rewritten).toContain("![[code-wiki.gif]]");
	});
});
