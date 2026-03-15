import { describe, expect, it } from "vitest";
import { getApiDocsHref } from "../api-docs";

describe("getApiDocsHref", () => {
	it("returns the localized docs path for supported locales", () => {
		expect(getApiDocsHref("ko-KR")).toBe("/docs/ko-kr/api-v1.html");
		expect(getApiDocsHref("zh_CN")).toBe("/docs/zh-cn/api-v1.html");
	});

	it("falls back to english for unsupported locales", () => {
		expect(getApiDocsHref("fr")).toBe("/docs/api-v1.html");
		expect(getApiDocsHref(undefined)).toBe("/docs/api-v1.html");
	});
});
