export type SupportedLanguage = "en" | "ko-kr" | "zh-cn" | "ja-jp";

const INTL_LOCALE_BY_LANGUAGE: Record<SupportedLanguage, string> = {
	en: "en-US",
	"ko-kr": "ko-KR",
	"zh-cn": "zh-CN",
	"ja-jp": "ja-JP",
};

export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
	return lang in INTL_LOCALE_BY_LANGUAGE;
}

export function normalizeLanguage(input?: string | null): SupportedLanguage {
	const normalized = input?.trim().toLowerCase().replaceAll("_", "-");

	if (!normalized) {
		return "en";
	}

	if (normalized === "en" || normalized.startsWith("en-")) return "en";
	if (normalized === "ko" || normalized.startsWith("ko-")) return "ko-kr";
	if (normalized === "zh" || normalized.startsWith("zh-")) return "zh-cn";
	if (normalized === "ja" || normalized.startsWith("ja-")) return "ja-jp";

	return "en";
}

export function getIntlLocale(language?: string | null): string {
	return INTL_LOCALE_BY_LANGUAGE[normalizeLanguage(language)];
}
