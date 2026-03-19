/* @jsxRuntime automatic */
/* @jsxImportSource hono/jsx */
import "../../../test/helpers/mock-iso-language";
import { describe, expect, it } from "vitest";
import { getApiDocsAlternateLinks, SITE_ORIGIN } from "../api-docs";
import { renderApiDocHtml } from "../api-docs.render";

describe("renderApiDocHtml", () => {
	it("renders a full documentation page with TOC and SEO links", async () => {
		const html = await renderApiDocHtml({
			markdown: `---
title: API v1 Reference
description: Test description
---

# API v1 Reference

## List pages

Details here.
`,
			lang: "en",
			canonicalUrl: `${SITE_ORIGIN}/docs/api-v1.html`,
			alternateLinks: getApiDocsAlternateLinks(),
		});

		expect(html).toContain("<!DOCTYPE html>");
		expect(html).toContain("API v1 Reference");
		expect(html).toContain("On this page");
		expect(html).toContain(
			'rel="canonical" href="https://mdto.page/docs/api-v1.html"',
		);
		expect(html).toContain(
			'rel="alternate" hreflang="en" href="https://mdto.page/docs/api-v1.html"',
		);
		expect(html).toContain(
			'rel="alternate" hreflang="ko-KR" href="https://mdto.page/docs/ko-kr/api-v1.html"',
		);
		expect(html).toContain(
			'rel="alternate" hreflang="ja-JP" href="https://mdto.page/docs/ja-jp/api-v1.html"',
		);
		expect(html).toContain(
			'rel="alternate" hreflang="x-default" href="https://mdto.page/docs/api-v1.html"',
		);
		expect(html).toContain('id="list-pages"');
	});
});
