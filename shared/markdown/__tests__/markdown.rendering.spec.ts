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

describe("markdownToHtml rendering tests", () => {
	describe("Safe content preservation", () => {
		it("should preserve safe HTML tags", async () => {
			const markdown = "# Heading\n\n**Bold** and *italic* text";
			const result = await markdownToHtml(markdown);
			expect(result.html).toContain("<h1 id=");
			expect(result.html).toContain("<strong>");
			expect(result.html).toContain("<em>");
		});

		it("should preserve safe links", async () => {
			const markdown = "[Google](https://google.com)";
			const result = await markdownToHtml(markdown);
			expect(result.html).toContain("<a");
			expect(result.html).toContain("https://google.com");
			expect(result.html).not.toContain("javascript:");
		});

		it("should preserve safe images", async () => {
			const markdown = "![Alt](https://example.com/image.jpg)";
			const result = await markdownToHtml(markdown);
			expect(result.html).toContain("<img");
			expect(result.html).toContain("https://example.com/image.jpg");
		});
	});

	describe("Heading ID generation", () => {
		it("should generate IDs for headings", async () => {
			const markdown = "# Chapter 1. Clean Code\n\n## Boy Scout Rule";
			const result = await markdownToHtml(markdown);
			expect(result.html).toContain("chapter-1-clean-code");
			expect(result.html).toContain("boy-scout-rule");
		});

		it("should handle duplicate English headings", async () => {
			const markdown = "# Title\n\n# Title\n\n# Title";
			const result = await markdownToHtml(markdown);
			expect(result.html).toContain("title");
			expect(result.html).toContain("title-1");
			expect(result.html).toContain("title-2");
		});

		it("should generate IDs for headings with special characters", async () => {
			const markdown = "# Hello, World!\n\n## Test (Example)";
			const result = await markdownToHtml(markdown);
			expect(result.html).toContain("hello-world");
			expect(result.html).toContain("test-example");
		});
	});
});
