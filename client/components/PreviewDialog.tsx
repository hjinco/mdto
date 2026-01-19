import { Close } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback } from "react";
import { usePreview } from "../hooks/usePreview";
import { cn } from "../utils/styles";

interface PreviewDialogProps {
	file: File;
	theme: string;
	expirationDays: number;
	onClose: () => void;
}

export function PreviewDialog({
	file,
	theme,
	expirationDays,
	onClose,
}: PreviewDialogProps) {
	const { loading, error, iframeRef, themeName } = usePreview({
		file,
		theme,
		expirationDays,
	});

	const handleOverlayClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === e.currentTarget) {
				onClose();
			}
		},
		[onClose],
	);

	const handleOverlayKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape" || e.key === "Enter") {
				onClose();
			}
		},
		[onClose],
	);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: Todo
		<div
			className="fixed inset-0 bg-black/80 z-1000 flex items-center justify-center p-2.5 backdrop-blur-sm animate-fade-in"
			onClick={handleOverlayClick}
			onKeyDown={handleOverlayKeyDown}
		>
			{/* Preview Dialog */}
			<div className="bg-surface border border-border rounded-xl w-[95vw] max-w-[95vw] h-[95vh] max-h-[95vh] flex flex-col shadow-dialog relative">
				{/* Header */}
				<div className="flex items-center justify-between py-4 px-5 border-b border-border">
					<div className="text-sm font-medium text-text-primary">
						Preview - {themeName}
					</div>
					<button
						className={cn(
							"w-8 h-8 flex items-center justify-center bg-transparent border border-border rounded-md text-text-secondary cursor-pointer transition-all duration-200",
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
				<div className="flex-1 overflow-auto relative min-h-[400px]">
					{loading && (
						<div className="flex items-center justify-center py-15 px-5 text-text-secondary text-[13px]">
							{error || "Loading preview..."}
						</div>
					)}
					<iframe
						ref={iframeRef}
						className="w-full h-full min-h-[400px] border-none block"
						title="Preview"
						style={{ display: loading ? "none" : "block" }}
					/>
				</div>
			</div>
		</div>
	);
}
