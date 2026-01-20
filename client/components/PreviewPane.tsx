import { Close } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect } from "react";
import { usePreview } from "../hooks/usePreview";
import { cn } from "../utils/styles";

interface PreviewPaneProps {
	file: File;
	theme: string;
	expirationDays: number;
	onClose: () => void;
	onLoadingChange: (isLoading: boolean) => void;
}

export function PreviewPane({
	file,
	theme,
	expirationDays,
	onClose,
	onLoadingChange,
}: PreviewPaneProps) {
	const { loading, iframeRef, themeName } = usePreview({
		file,
		theme,
		expirationDays,
	});

	useEffect(() => {
		onLoadingChange?.(loading);
	}, [loading, onLoadingChange]);

	return (
		<div
			className={cn(
				"bg-surface flex flex-col shadow-card overflow-hidden h-full border-r border-border",
				"transition-opacity duration-500",
				loading ? "opacity-0" : "opacity-100",
			)}
		>
			{/* Header */}
			<div className="flex items-center justify-between py-3 px-5 border-b border-border bg-surface-elevated">
				<div className="text-sm font-medium text-text-primary">
					Preview - {themeName}
				</div>
				<button
					className={cn(
						"w-7 h-7 flex items-center justify-center bg-transparent border border-border rounded-md text-text-secondary cursor-pointer transition-all duration-200",
						"hover:bg-surface-highlight hover:border-text-tertiary hover:text-text-primary",
					)}
					onClick={onClose}
					type="button"
					aria-label="Close preview"
				>
					<HugeiconsIcon icon={Close} className="w-4 h-4" />
				</button>
			</div>

			{/* Content */}
			<div className="flex-1 relative bg-white">
				<iframe
					ref={iframeRef}
					className="w-full h-full border-none block"
					title="Preview"
				/>
			</div>
		</div>
	);
}
