import { Close } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { markdownToHtml } from "@shared/utils/markdown";
import { useCallback, useEffect, useRef, useState } from "react";

interface PreviewDialogProps {
	file: File;
	theme: string;
	onClose: () => void;
}

export function PreviewDialog({ file, theme, onClose }: PreviewDialogProps) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const iframeRef = useRef<HTMLIFrameElement>(null);

	const themeName = theme.charAt(0).toUpperCase() + theme.slice(1);

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

	useEffect(() => {
		const renderPreview = async () => {
			try {
				const markdown = await file.text();

				const htmlContent = await markdownToHtml(markdown);
				const themePath = `/themes/${theme}.css`;

				const previewHtml = `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Preview - ${themeName}</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
	<link rel="stylesheet" href="${themePath}">
</head>
<body>
	<div class="content">
		${htmlContent}
	</div>
	<footer>
		<p>Powered by <a href="https://mdto.page">mdto.page</a></p>
	</footer>
</body>
</html>`;

				const iframe = iframeRef.current;
				if (iframe) {
					const iframeDoc =
						iframe.contentDocument || iframe.contentWindow?.document;
					if (iframeDoc) {
						iframeDoc.open();
						iframeDoc.write(previewHtml);
						iframeDoc.close();
					}
				}

				setLoading(false);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
				setLoading(false);
			}
		};

		renderPreview();
	}, [file, theme, themeName]);

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
						className="w-8 h-8 flex items-center justify-center bg-transparent border border-border rounded-md text-text-secondary cursor-pointer transition-all duration-200 hover:bg-surface-highlight hover:border-text-tertiary hover:text-text-primary"
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
