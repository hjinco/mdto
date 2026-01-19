import { Close } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { usePreview } from "../hooks/usePreview";
import { cn } from "../utils/styles";

interface PreviewPaneProps {
	file: File;
	theme: string;
	expirationDays: number;
	onClose: () => void;
}

export function PreviewPane({
	file,
	theme,
	expirationDays,
	onClose,
}: PreviewPaneProps) {
	const { loading, error, iframeRef, themeName } = usePreview({
		file,
		theme,
		expirationDays,
	});

	return (
		<div className="bg-surface flex flex-col shadow-card overflow-hidden h-full border-r border-border">
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
				{loading && (
					<div className="absolute inset-0 flex items-center justify-center text-text-secondary text-[13px] bg-surface">
						{error || "Loading preview..."}
					</div>
				)}
				<iframe
					ref={iframeRef}
					className="w-full h-full border-none block"
					title="Preview"
					style={{ display: loading ? "none" : "block" }}
				/>
			</div>
		</div>
	);
}
