import { describe, expect, it } from "vitest";
import { getIntlLocale, normalizeLanguage } from "./language";

describe("normalizeLanguage", () => {
	it("maps locale variants to the canonical app locale", () => {
		expect(normalizeLanguage("ko-KR")).toBe("ko-kr");
		expect(normalizeLanguage("zh_CN")).toBe("zh-cn");
		expect(normalizeLanguage("ja")).toBe("ja-jp");
		expect(normalizeLanguage("ja-JP")).toBe("ja-jp");
	});

	it("falls back to english for unknown or missing locales", () => {
		expect(normalizeLanguage("fr")).toBe("en");
		expect(normalizeLanguage(undefined)).toBe("en");
	});
});

describe("getIntlLocale", () => {
	it("returns the Intl locale for supported languages", () => {
		expect(getIntlLocale("en")).toBe("en-US");
		expect(getIntlLocale("ko-KR")).toBe("ko-KR");
		expect(getIntlLocale("zh-cn")).toBe("zh-CN");
		expect(getIntlLocale("ja-JP")).toBe("ja-JP");
	});
});
