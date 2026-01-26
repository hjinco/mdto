import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { changeLanguage, type SupportedLanguage } from "../lib/i18n";
import { cn } from "../utils/styles";

type LanguageOption = {
	value: SupportedLanguage;
	label: string;
};

const OPTIONS: LanguageOption[] = [
	{ value: "en", label: "English" },
	{ value: "ko-kr", label: "한국어" },
	{ value: "zh-cn", label: "简体中文" },
];

export function LanguageSelect({ className }: { className?: string }) {
	const { i18n } = useTranslation();

	const value = useMemo<SupportedLanguage>(() => {
		const lang = (i18n.resolvedLanguage ?? i18n.language ?? "en").toLowerCase();
		if (lang === "ko-kr") return "ko-kr";
		if (lang === "zh-cn") return "zh-cn";
		return "en";
	}, [i18n.language, i18n.resolvedLanguage]);

	return (
		<div className={cn("relative inline-flex items-center", className)}>
			<span className="sr-only">Language</span>
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
				{OPTIONS.map((opt) => (
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
