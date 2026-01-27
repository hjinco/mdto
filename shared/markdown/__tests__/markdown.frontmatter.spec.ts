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

describe("markdownToHtml frontmatter tests", () => {
	describe("Frontmatter handling logic", () => {
		it("should parse frontmatter and render as structured HTML", async () => {
			const markdown = "---\ntitle: Hello World\nauthor: John Doe\n---";
			const result = await markdownToHtml(markdown);
			expect(result.html).toContain('<div class="frontmatter-container">');
			expect(result.html).toContain(
				'<div class="frontmatter-label">title</div>',
			);
			expect(result.html).toContain(
				'<div class="frontmatter-value">Hello World</div>',
			);
			expect(result.html).toContain(
				'<div class="frontmatter-label">author</div>',
			);
			expect(result.html).toContain(
				'<div class="frontmatter-value">John Doe</div>',
			);
		});

		it("should handle date objects correctly", async () => {
			// Using a date string that js-yaml will parse as a Date object.
			const markdown = "---\ndate: 2024-01-01\n---";
			const result = await markdownToHtml(markdown);
			expect(result.html).toContain(
				'<div class="frontmatter-label">date</div>',
			);
			// The exact format might depend on locale; check for the year.
			expect(result.html).toContain("2024");
		});

		it("should ignore invalid yaml", async () => {
			const markdown = "---\n: invalid yaml\n---";
			const result = await markdownToHtml(markdown);
			expect(result.html).not.toContain('<div class="frontmatter-container">');
		});
	});
});
