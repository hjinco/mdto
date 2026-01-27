import { describe, expect, it, vi } from "vitest";
import { markdownToHtml } from "../markdown";

vi.mock("iso-639-3-to-1", () => {
	return {
		default: (code: string) => {
			if (code === "eng") return "en" as const;
			return undefined;
		},
	};
});

describe("markdownToHtml metadata tests", () => {
	describe("Metadata extraction", () => {
		it("should extract title and description from frontmatter", async () => {
			const markdown =
				"---\ntitle: My Title\ndescription: My Description\n---\n# Heading";
			const result = await markdownToHtml(markdown);
			expect(result.metadata.title).toBe("My Title");
			expect(result.metadata.description).toBe("My Description");
		});

		it("should fallback to first heading for title", async () => {
			const markdown = "# First Heading\n\nSome paragraph text.";
			const result = await markdownToHtml(markdown);
			expect(result.metadata.title).toBe("First Heading");
		});

		it("should fallback to first paragraph for description", async () => {
			const markdown = "# Heading\n\nThis is the first paragraph.";
			const result = await markdownToHtml(markdown);
			expect(result.metadata.description).toBe("This is the first paragraph.");
		});

		it("should prefer frontmatter over heading/paragraph", async () => {
			const markdown =
				"---\ntitle: FM Title\ndescription: FM Desc\n---\n# Heading\n\nParagraph";
			const result = await markdownToHtml(markdown);
			expect(result.metadata.title).toBe("FM Title");
			expect(result.metadata.description).toBe("FM Desc");
		});

		it("should return empty metadata for empty markdown", async () => {
			const markdown = "";
			const result = await markdownToHtml(markdown);
			expect(result.metadata.title).toBeUndefined();
			expect(result.metadata.description).toBeUndefined();
		});

		it("should return empty metadata when no extractable content exists", async () => {
			const markdown = "```javascript\nconst x = 1;\n```";
			const result = await markdownToHtml(markdown);
			expect(result.metadata.title).toBeUndefined();
			expect(result.metadata.description).toBeUndefined();
		});

		it("should return empty metadata for markdown with only whitespace", async () => {
			const markdown = "   \n\n   \n";
			const result = await markdownToHtml(markdown);
			expect(result.metadata.title).toBeUndefined();
			expect(result.metadata.description).toBeUndefined();
		});

		it("should set metadata.lang using iso6393To1 mapping", async () => {
			const markdown = "# Hello world\n\nThis is an english sentence.";
			const result = await markdownToHtml(markdown);
			expect(result.metadata.lang).toBe("en");
		});

		it("should not set metadata.lang when franc returns und", async () => {
			const markdown = "# Hello\n\nShort text.";
			const result = await markdownToHtml(markdown);
			expect(result.metadata.lang).toBeUndefined();
		});

		it("should not set metadata.lang when iso6393To1 has no mapping", async () => {
			const markdown = "# Bonjour\n\nCeci est une phrase française.";
			const result = await markdownToHtml(markdown);
			expect(result.metadata.lang).toBeUndefined();
		});

		it("should set hasWikiLink for wiki-style links", async () => {
			const markdown = "[[Internal link]]";
			const result = await markdownToHtml(markdown);
			expect(result.metadata.hasWikiLink).toBe(true);
		});

		it("should set hasWikiLink for wiki-style embeds", async () => {
			const markdown = "![[Image.png]]";
			const result = await markdownToHtml(markdown);
			expect(result.metadata.hasWikiLink).toBe(true);
		});

		it("should not set hasWikiLink for regular markdown", async () => {
			const markdown = "# Heading\n\nJust normal text.";
			const result = await markdownToHtml(markdown);
			expect(result.metadata.hasWikiLink).not.toBe(true);
		});
	});
});
