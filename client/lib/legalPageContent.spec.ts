import { describe, expect, it } from "vitest";
import {
	getLegalPageContent,
	resolveLegalPageLanguage,
} from "./legalPageContent";

describe("resolveLegalPageLanguage", () => {
	it("maps supported locale variants to the canonical app locale", () => {
		expect(resolveLegalPageLanguage("ko-KR")).toBe("ko-kr");
		expect(resolveLegalPageLanguage("zh_CN")).toBe("zh-cn");
		expect(resolveLegalPageLanguage("ja")).toBe("ja-jp");
		expect(resolveLegalPageLanguage("ja-JP")).toBe("ja-jp");
	});

	it("falls back to english for unknown locales", () => {
		expect(resolveLegalPageLanguage("fr")).toBe("en");
		expect(resolveLegalPageLanguage(undefined)).toBe("en");
	});
});

describe("getLegalPageContent", () => {
	it("returns localized legal page content", () => {
		expect(getLegalPageContent("privacy", "ja-JP").pageTitle).toBe(
			"プライバシーポリシー",
		);
		expect(getLegalPageContent("terms", "ko-KR").pageTitle).toBe("이용약관");
	});

	it("falls back to english content for unsupported locales", () => {
		expect(getLegalPageContent("terms", "fr").pageTitle).toBe(
			"Terms of Service",
		);
	});
});
