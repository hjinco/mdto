import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../lib/i18n";
import { normalizeLanguage, type SupportedLanguage } from "../lib/language";
import { cn } from "../utils/styles";

type LanguageOption = {
	value: SupportedLanguage;
	label: string;
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
	{ value: "en", label: "English" },
	{ value: "ko-kr", label: "한국어" },
	{ value: "zh-cn", label: "简体中文" },
	{ value: "ja-jp", label: "日本語" },
];

export function getResolvedLanguage(
	language?: string,
	resolvedLanguage?: string,
): SupportedLanguage {
	return normalizeLanguage(resolvedLanguage ?? language);
}

export function LanguageSelect({ className }: { className?: string }) {
	const { i18n, t } = useTranslation();

	const value = useMemo<SupportedLanguage>(
		() => getResolvedLanguage(i18n.language, i18n.resolvedLanguage),
		[i18n.language, i18n.resolvedLanguage],
	);

	return (
		<div className={cn("relative inline-flex items-center", className)}>
			<span className="sr-only">{t("languageSelect.ariaLabel")}</span>
			<select
				value={value}
				onChange={(e) => {
					void changeLanguage(e.target.value as SupportedLanguage);
				}}
				className={cn(
					"h-8 rounded-md bg-surface-card border border-border pl-3 pr-8 text-xs text-text-secondary appearance-none",
					"hover:text-text-primary hover:border-text-tertiary transition-colors cursor-pointer",
					"focus:outline-none focus:ring-2 focus:ring-white/10",
				)}
			>
				{LANGUAGE_OPTIONS.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
			<HugeiconsIcon
				icon={ArrowDown01Icon}
				className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none"
			/>
		</div>
	);
}
