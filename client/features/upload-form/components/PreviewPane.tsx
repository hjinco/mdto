import { Close } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ThemeId } from "@shared/themes/theme-registry";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/styles";
import { usePreview } from "../hooks/usePreview";
import type { ParsedMarkdown } from "./MarkdownParser";

interface PreviewPaneProps {
	parsed: ParsedMarkdown | null;
	theme: ThemeId;
	expirationDays: number;
	onClose: () => void;
	onLoadingChange: (isLoading: boolean) => void;
}

export function PreviewPane({
	parsed,
	theme,
	expirationDays,
	onClose,
	onLoadingChange,
}: PreviewPaneProps) {
	const { t } = useTranslation();
	const { loading, iframeRef, themeName } = usePreview({
		parsed,
		theme,
		expirationDays,
	});

	useEffect(() => {
		onLoadingChange?.(loading);
	}, [loading, onLoadingChange]);

	return (
		<div className="bg-surface flex flex-col shadow-card overflow-hidden h-full border-r border-border">
			<div className="flex items-center justify-between py-3 px-5 border-b border-border bg-surface-elevated">
				<div className="text-sm font-medium text-text-primary">
					{t("previewDialog.title", { theme: themeName })}
				</div>
				<button
					className={cn(
						"w-7 h-7 flex items-center justify-center bg-transparent border border-border rounded-md text-text-secondary cursor-pointer transition-all duration-200",
						"hover:bg-surface-highlight hover:border-text-tertiary hover:text-text-primary",
					)}
					onClick={onClose}
					type="button"
					aria-label={t("previewDialog.closeAria")}
				>
					<HugeiconsIcon icon={Close} className="w-4 h-4" />
				</button>
			</div>

			<div
				data-testid="preview-iframe-wrapper"
				className={cn(
					"flex-1 relative bg-white transition-opacity duration-200",
					loading ? "opacity-0" : "opacity-100",
				)}
			>
				<iframe
					ref={iframeRef}
					className="w-full h-full border-none block"
					title={t("previewDialog.iframeTitle")}
				/>
			</div>
		</div>
	);
}
