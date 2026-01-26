import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./i18nResources";

export type SupportedLanguage = "en" | "ko-kr" | "zh-cn";

const STORAGE_KEY = "mdto.lang";
let hasExplicitUserLanguageChoice = false;

function isSupportedLanguage(lang: string): lang is SupportedLanguage {
	return lang === "en" || lang === "ko-kr" || lang === "zh-cn";
}

export function normalizeLanguage(input: string): SupportedLanguage {
	const lower = input.trim().toLowerCase().replaceAll("_", "-");
	if (lower === "en" || lower.startsWith("en-")) return "en";
	if (lower === "ko" || lower.startsWith("ko-")) return "ko-kr";
	if (lower === "zh" || lower.startsWith("zh-")) return "zh-cn";
	return "en";
}

function getStoredLanguage(): SupportedLanguage | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		return raw && isSupportedLanguage(raw) ? raw : null;
	} catch {
		return null;
	}
}

function getNavigatorLanguage(): string {
	if (typeof window === "undefined") return "en";
	const languages = window.navigator.languages;
	if (Array.isArray(languages) && languages.length > 0)
		return languages[0] ?? "en";
	return window.navigator.language || "en";
}

export async function initClientLanguage(): Promise<SupportedLanguage> {
	if (typeof window === "undefined") return "en";
	if (hasExplicitUserLanguageChoice) {
		return (i18n.resolvedLanguage ??
			i18n.language ??
			"en") as SupportedLanguage;
	}

	const stored = getStoredLanguage();
	const preferred = stored ?? normalizeLanguage(getNavigatorLanguage());

	// If no explicit choice exists, persist the detected choice (so it stays stable).
	if (!stored) {
		try {
			window.localStorage.setItem(STORAGE_KEY, preferred);
		} catch {
			// ignore
		}
	}

	if (preferred !== (i18n.resolvedLanguage ?? i18n.language)) {
		await i18n.changeLanguage(preferred);
	}

	return preferred;
}

export async function changeLanguage(lang: SupportedLanguage): Promise<void> {
	hasExplicitUserLanguageChoice = true;
	// Persist first to avoid a race with initClientLanguage() on mount.
	if (typeof window !== "undefined") {
		try {
			window.localStorage.setItem(STORAGE_KEY, lang);
		} catch {
			// ignore
		}
	}
	await i18n.changeLanguage(lang);
}

// IMPORTANT:
// - Prerendered HTML is always English.
// - To avoid hydration mismatch, we initialize i18n as `en` for the initial render.
// - After mount, `initClientLanguage()` can switch language on the client.
if (!i18n.isInitialized) {
	void i18n.use(initReactI18next).init({
		resources,
		lng: "en",
		fallbackLng: "en",
		supportedLngs: ["en", "ko-kr", "zh-cn"],
		lowerCaseLng: true,
		load: "currentOnly",
		interpolation: {
			escapeValue: false,
		},
		// Make init synchronous for SSR/prerender (resources are in-memory).
		initImmediate: false,
	});
}

export { i18n };
