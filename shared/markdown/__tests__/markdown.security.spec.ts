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

describe("markdownToHtml security tests", () => {
	describe("XSS prevention - Script tags", () => {
		it("should sanitize script tags in markdown", async () => {
			const malicious = "<script>alert('XSS')</script>";
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("<script>");
			expect(result.html).not.toContain("alert('XSS')");
		});

		it("should sanitize script tags with src attribute", async () => {
			const malicious = '<script src="evil.js"></script>';
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("<script");
			expect(result.html).not.toContain("evil.js");
		});

		it("should sanitize script tags in markdown code blocks", async () => {
			const malicious = "```html\n<script>alert('XSS')</script>\n```";
			const result = await markdownToHtml(malicious);
			// Code blocks should be preserved but script tags should be sanitized.
			expect(result.html).not.toContain("<script>alert('XSS')</script>");
		});
	});

	describe("XSS prevention - Event handlers", () => {
		it("should sanitize onclick attribute", async () => {
			const malicious = "<div onclick=\"alert('XSS')\">Click me</div>";
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("onclick");
			expect(result.html).not.toContain("alert('XSS')");
		});

		it("should sanitize onerror attribute", async () => {
			const malicious = '<img src="x" onerror="alert(\'XSS\')">';
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("onerror");
			expect(result.html).not.toContain("alert('XSS')");
		});

		it("should sanitize onload attribute", async () => {
			const malicious = "<body onload=\"alert('XSS')\">";
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("onload");
			expect(result.html).not.toContain("alert('XSS')");
		});

		it("should sanitize onmouseover attribute", async () => {
			const malicious = "<div onmouseover=\"alert('XSS')\">Hover</div>";
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("onmouseover");
			expect(result.html).not.toContain("alert('XSS')");
		});

		it("should sanitize multiple event handlers", async () => {
			const malicious =
				'<div onclick="alert(1)" onmouseover="alert(2)" onfocus="alert(3)">Test</div>';
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("onclick");
			expect(result.html).not.toContain("onmouseover");
			expect(result.html).not.toContain("onfocus");
		});
	});

	describe("XSS prevention - JavaScript URLs", () => {
		it("should sanitize javascript: URLs in href", async () => {
			const malicious = "<a href=\"javascript:alert('XSS')\">Click</a>";
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("javascript:");
			expect(result.html).not.toContain("alert('XSS')");
		});

		it("should sanitize javascript: URLs in markdown links", async () => {
			const malicious = '[Click](javascript:alert("XSS"))';
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("javascript:");
			expect(result.html).not.toContain('alert("XSS")');
		});

		it("should sanitize javascript: URLs with encoded characters", async () => {
			const malicious = "<a href=\"javascript&#58;alert('XSS')\">Click</a>";
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("javascript");
			expect(result.html).not.toContain("alert('XSS')");
		});
	});

	describe("XSS prevention - Data URLs", () => {
		it("should sanitize data URLs with JavaScript", async () => {
			const malicious =
				"<img src=\"data:text/html,<script>alert('XSS')</script>\">";
			const result = await markdownToHtml(malicious);
			// Dangerous data URLs should be sanitized.
			expect(result.html).not.toContain("<script>");
			expect(result.html).not.toContain("alert('XSS')");
		});

		it("should sanitize data URLs with base64 encoded script", async () => {
			const malicious =
				'<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=">';
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("<script>");
		});
	});

	describe("XSS prevention - SVG and iframe", () => {
		it("should sanitize SVG with script tags", async () => {
			const malicious = '<svg><script>alert("XSS")</script></svg>';
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("<script>");
			expect(result.html).not.toContain('alert("XSS")');
		});

		it("should sanitize iframe tags", async () => {
			const malicious = '<iframe src="evil.com"></iframe>';
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("<iframe");
		});

		it("should sanitize object and embed tags", async () => {
			const malicious =
				'<object data="evil.swf"></object><embed src="evil.swf">';
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("<object");
			expect(result.html).not.toContain("<embed");
		});
	});

	describe("XSS prevention - Style injection", () => {
		it("should sanitize style attribute with expression", async () => {
			const malicious =
				"<div style=\"background: expression(alert('XSS'))\">Test</div>";
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("expression");
			expect(result.html).not.toContain("alert('XSS')");
		});

		it("should sanitize style attribute with javascript URL", async () => {
			const malicious =
				"<div style=\"background: url(javascript:alert('XSS'))\">Test</div>";
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("javascript:");
			expect(result.html).not.toContain("alert('XSS')");
		});
	});

	describe("XSS prevention - Form and input", () => {
		it("should sanitize form tags", async () => {
			const malicious = '<form action="evil.com"><input name="data"></form>';
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("<form");
		});

		it("should sanitize input tags with malicious attributes", async () => {
			const malicious = "<input onfocus=\"alert('XSS')\" autofocus>";
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("onfocus");
			expect(result.html).not.toContain("autofocus");
		});
	});

	describe("XSS prevention - Complex attack vectors", () => {
		it("should sanitize nested malicious content", async () => {
			const malicious =
				'<div><script>alert("XSS")</script><img src="x" onerror="alert(\'XSS\')"></div>';
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("<script>");
			expect(result.html).not.toContain("onerror");
			expect(result.html).not.toContain("alert");
		});

		it("should sanitize markdown with mixed malicious content", async () => {
			const malicious = `# Title
			
Normal text here.

<script>alert('XSS')</script>

[Link](javascript:alert('XSS'))

<img src="x" onerror="alert('XSS')">`;
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("<script>");
			expect(result.html).not.toContain("javascript:");
			expect(result.html).not.toContain("onerror");
			expect(result.html).not.toContain("alert('XSS')");
		});

		it("should sanitize HTML entities used for obfuscation", async () => {
			const malicious =
				'<img src="x" onerror="&#97;&#108;&#101;&#114;&#116;&#40;&#39;&#88;&#83;&#83;&#39;&#41;">';
			const result = await markdownToHtml(malicious);
			expect(result.html).not.toContain("onerror");
			// Decoded alert should not be present.
			expect(result.html).not.toMatch(/alert\s*\(/i);
		});
	});
});
