import { describe, expect, it } from "vitest";
import { markdownToHtml } from "./markdown";

describe("markdownToHtml security tests", () => {
	describe("XSS prevention - Script tags", () => {
		it("should sanitize script tags in markdown", async () => {
			const malicious = "<script>alert('XSS')</script>";
			const result = await markdownToHtml(malicious);
			expect(result).not.toContain("<script>");
			expect(result).not.toContain("alert('XSS')");
		});

		it("should sanitize script tags with src attribute", () => {
			const malicious = '<script src="evil.js"></script>';
			const result = markdownToHtml(malicious);
			expect(result).not.toContain("<script");
			expect(result).not.toContain("evil.js");
		});

		it("should sanitize script tags in markdown code blocks", () => {
			const malicious = "```html\n<script>alert('XSS')</script>\n```";
			const result = markdownToHtml(malicious);
			// Code blocks should be preserved but script tags should be sanitized
			expect(result).not.toContain("<script>alert('XSS')</script>");
		});
	});

	describe("XSS prevention - Event handlers", () => {
		it("should sanitize onclick attribute", () => {
			const malicious = "<div onclick=\"alert('XSS')\">Click me</div>";
			const result = markdownToHtml(malicious);
			expect(result).not.toContain("onclick");
			expect(result).not.toContain("alert('XSS')");
		});

		it("should sanitize onerror attribute", () => {
			const malicious = '<img src="x" onerror="alert(\'XSS\')">';
			const result = markdownToHtml(malicious);
			expect(result).not.toContain("onerror");
			expect(result).not.toContain("alert('XSS')");
		});

		it("should sanitize onload attribute", () => {
			const malicious = "<body onload=\"alert('XSS')\">";
			const result = markdownToHtml(malicious);
			expect(result).not.toContain("onload");
			expect(result).not.toContain("alert('XSS')");
		});

		it("should sanitize onmouseover attribute", () => {
			const malicious = "<div onmouseover=\"alert('XSS')\">Hover</div>";
			const result = markdownToHtml(malicious);
			expect(result).not.toContain("onmouseover");
			expect(result).not.toContain("alert('XSS')");
		});

		it("should sanitize multiple event handlers", () => {
			const malicious =
				'<div onclick="alert(1)" onmouseover="alert(2)" onfocus="alert(3)">Test</div>';
			const result = markdownToHtml(malicious);
			expect(result).not.toContain("onclick");
			expect(result).not.toContain("onmouseover");
			expect(result).not.toContain("onfocus");
		});
	});

	describe("XSS prevention - JavaScript URLs", () => {
		it("should sanitize javascript: URLs in href", () => {
			const malicious = "<a href=\"javascript:alert('XSS')\">Click</a>";
			const result = markdownToHtml(malicious);
			expect(result).not.toContain("javascript:");
			expect(result).not.toContain("alert('XSS')");
		});

		it("should sanitize javascript: URLs in markdown links", () => {
			const malicious = '[Click](javascript:alert("XSS"))';
			const result = markdownToHtml(malicious);
			expect(result).not.toContain("javascript:");
			expect(result).not.toContain('alert("XSS")');
		});

		it("should sanitize javascript: URLs with encoded characters", () => {
			const malicious = "<a href=\"javascript&#58;alert('XSS')\">Click</a>";
			const result = markdownToHtml(malicious);
			expect(result).not.toContain("javascript");
			expect(result).not.toContain("alert('XSS')");
		});
	});

	describe("XSS prevention - Data URLs", () => {
		it("should sanitize data URLs with JavaScript", () => {
			const malicious =
				"<img src=\"data:text/html,<script>alert('XSS')</script>\">";
			const result = markdownToHtml(malicious);
			// DOMPurify should sanitize dangerous data URLs
			expect(result).not.toContain("<script>");
			expect(result).not.toContain("alert('XSS')");
		});

		it("should sanitize data URLs with base64 encoded script", () => {
			const malicious =
				'<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=">';
			const result = markdownToHtml(malicious);
			expect(result).not.toContain("<script>");
		});
	});

	describe("XSS prevention - SVG and iframe", () => {
		it("should sanitize SVG with script tags", () => {
			const malicious = '<svg><script>alert("XSS")</script></svg>';
			const result = markdownToHtml(malicious);
			expect(result).not.toContain("<script>");
			expect(result).not.toContain('alert("XSS")');
		});

		it("should sanitize iframe tags", () => {
			const malicious = '<iframe src="evil.com"></iframe>';
			const result = markdownToHtml(malicious);
			expect(result).not.toContain("<iframe");
		});

		it("should sanitize object and embed tags", () => {
			const malicious =
				'<object data="evil.swf"></object><embed src="evil.swf">';
			const result = markdownToHtml(malicious);
			expect(result).not.toContain("<object");
			expect(result).not.toContain("<embed");
		});
	});

	describe("XSS prevention - Style injection", () => {
		it("should sanitize style attribute with expression", async () => {
			const malicious =
				"<div style=\"background: expression(alert('XSS'))\">Test</div>";
			const result = await markdownToHtml(malicious);
			expect(result).not.toContain("expression");
			expect(result).not.toContain("alert('XSS')");
		});

		it("should sanitize style attribute with javascript URL", async () => {
			const malicious =
				"<div style=\"background: url(javascript:alert('XSS'))\">Test</div>";
			const result = await markdownToHtml(malicious);
			expect(result).not.toContain("javascript:");
			expect(result).not.toContain("alert('XSS')");
		});
	});

	describe("XSS prevention - Form and input", () => {
		it("should sanitize form tags", async () => {
			const malicious = '<form action="evil.com"><input name="data"></form>';
			const result = await markdownToHtml(malicious);
			expect(result).not.toContain("<form");
		});

		it("should sanitize input tags with malicious attributes", async () => {
			const malicious = "<input onfocus=\"alert('XSS')\" autofocus>";
			const result = await markdownToHtml(malicious);
			expect(result).not.toContain("onfocus");
			expect(result).not.toContain("autofocus");
		});
	});

	describe("XSS prevention - Complex attack vectors", () => {
		it("should sanitize nested malicious content", async () => {
			const malicious =
				'<div><script>alert("XSS")</script><img src="x" onerror="alert(\'XSS\')"></div>';
			const result = await markdownToHtml(malicious);
			expect(result).not.toContain("<script>");
			expect(result).not.toContain("onerror");
			expect(result).not.toContain("alert");
		});

		it("should sanitize markdown with mixed malicious content", async () => {
			const malicious = `# Title
			
Normal text here.

<script>alert('XSS')</script>

[Link](javascript:alert('XSS'))

<img src="x" onerror="alert('XSS')">`;
			const result = await markdownToHtml(malicious);
			expect(result).not.toContain("<script>");
			expect(result).not.toContain("javascript:");
			expect(result).not.toContain("onerror");
			expect(result).not.toContain("alert('XSS')");
		});

		it("should sanitize HTML entities used for obfuscation", async () => {
			const malicious =
				'<img src="x" onerror="&#97;&#108;&#101;&#114;&#116;&#40;&#39;&#88;&#83;&#83;&#39;&#41;">';
			const result = await markdownToHtml(malicious);
			expect(result).not.toContain("onerror");
			// Decoded alert should not be present
			expect(result).not.toMatch(/alert\s*\(/i);
		});
	});

	describe("Safe content preservation", () => {
		it("should preserve safe HTML tags", async () => {
			const markdown = "# Heading\n\n**Bold** and *italic* text";
			const result = await markdownToHtml(markdown);
			expect(result).toContain("<h1 id=");
			expect(result).toContain("<strong>");
			expect(result).toContain("<em>");
		});

		it("should preserve safe links", async () => {
			const markdown = "[Google](https://google.com)";
			const result = await markdownToHtml(markdown);
			expect(result).toContain("<a");
			expect(result).toContain("https://google.com");
			expect(result).not.toContain("javascript:");
		});

		it("should preserve safe images", async () => {
			const markdown = "![Alt](https://example.com/image.jpg)";
			const result = await markdownToHtml(markdown);
			expect(result).toContain("<img");
			expect(result).toContain("https://example.com/image.jpg");
		});
	});

	describe("Heading ID generation", () => {
		it("should generate IDs for headings", async () => {
			const markdown = "# Chapter 1. Clean Code\n\n## Boy Scout Rule";
			const result = await markdownToHtml(markdown);
			expect(result).toContain("chapter-1-clean-code");
			expect(result).toContain("boy-scout-rule");
		});

		it("should handle duplicate English headings", async () => {
			const markdown = "# Title\n\n# Title\n\n# Title";
			const result = await markdownToHtml(markdown);
			expect(result).toContain("title");
			expect(result).toContain("title-1");
			expect(result).toContain("title-2");
		});

		it("should generate IDs for headings with special characters", async () => {
			const markdown = "# Hello, World!\n\n## Test (Example)";
			const result = await markdownToHtml(markdown);
			expect(result).toContain("hello-world");
			expect(result).toContain("test-example");
		});
	});
});
