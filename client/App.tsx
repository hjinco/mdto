import { Github } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import Turnstile from "react-turnstile";
import { PreviewDialog } from "./components/PreviewDialog";
import { PreviewPane } from "./components/PreviewPane";
import { SuccessView } from "./components/SuccessView";
import { UploadView } from "./components/UploadView";
import { useFileSelection } from "./hooks/useFileSelection";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { usePreviewState } from "./hooks/usePreviewState";
import { useResizablePane } from "./hooks/useResizablePane";
import { useUpload } from "./hooks/useUpload";
import { cn } from "./utils/styles";

export function App() {
	const [expirationDays, setExpirationDays] = useState(30);
	const [selectedTheme, setSelectedTheme] = useState("default");
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

	const { selectedFile, fileInputRef, handleFileSelect, clearSelection } =
		useFileSelection();

	const {
		showPreview,
		isPreviewLoading,
		setIsPreviewLoading,
		togglePreview,
		closePreview,
	} = usePreviewState();

	const { isUploading, uploadedUrl, handleUpload, handleReset } = useUpload({
		file: selectedFile,
		expirationDays,
		theme: selectedTheme,
		turnstileToken,
		onSuccess: closePreview,
		onClearFile: () => {
			clearSelection();
			setExpirationDays(30);
			setSelectedTheme("default");
		},
	});

	useKeyboardShortcuts({
		onOpenFile: () => fileInputRef.current?.click(),
		onClosePreview: closePreview,
		canOpenFile: !uploadedUrl,
		canClosePreview: showPreview,
	});

	const {
		width: previewWidth,
		isResizing,
		startResizing: handleMouseDown,
	} = useResizablePane();

	return (
		<>
			{/* Main Container - Conditional Styles for Split View */}
			<div
				className={cn(
					"relative z-1 w-full flex flex-col items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
					"min-h-screen w-full max-w-[480px] px-5",
					showPreview &&
						selectedFile &&
						"md:max-w-none md:px-0 md:h-screen md:grid md:items-start md:justify-start",
				)}
				style={
					showPreview && selectedFile && window.innerWidth >= 768
						? {
								gridTemplateColumns: `${previewWidth}% auto 1fr`,
							}
						: undefined
				}
			>
				{/* Left Pane (Preview) - Desktop Only */}
				{showPreview && selectedFile && (
					<div
						className={cn(
							"hidden md:block h-full w-full overflow-hidden",
							isResizing && "pointer-events-none",
						)}
					>
						<PreviewPane
							file={selectedFile}
							theme={selectedTheme}
							expirationDays={expirationDays}
							onClose={closePreview}
							onLoadingChange={setIsPreviewLoading}
						/>
					</div>
				)}

				{/* Resizer Handle */}
				{showPreview && selectedFile && (
					<button
						type="button"
						className="hidden md:flex w-4 h-full cursor-col-resize items-center justify-center hover:bg-white/5 transition-colors group z-10 -ml-2 select-none"
						onMouseDown={handleMouseDown}
					>
						<div
							className={cn(
								"w-0.5 h-8 bg-border rounded-full transition-all group-hover:h-12 group-hover:bg-text-tertiary",
								isResizing && "bg-text-primary h-12",
							)}
						/>
					</button>
				)}

				{/* Right Pane (Upload/Settings) */}
				<div
					className={cn(
						"w-full flex flex-col items-center justify-center",
						showPreview && "md:h-full md:p-6 md:bg-background",
						// Only apply layout styles when not in preview mode or on mobile
						!(showPreview && selectedFile) && "max-w-[440px] mx-auto",
					)}
				>
					{/* Logo */}
					<div className="flex items-center justify-center mb-10 opacity-100">
						<div className="text-lg font-semibold tracking-[-0.02em] bg-linear-to-b from-white to-[#a0a0a0] bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
							mdto.page
						</div>
					</div>

					{/* Card */}
					<div className="w-full max-w-[440px] bg-surface-card border border-border rounded-xl p-1.5 shadow-card transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] relative hover:border-[#2a2b30] hover:shadow-card-hover">
						{uploadedUrl ? (
							<SuccessView url={uploadedUrl} onReset={handleReset} />
						) : (
							<UploadView
								selectedFile={selectedFile}
								expirationDays={expirationDays}
								selectedTheme={selectedTheme}
								isUploading={isUploading}
								fileInputRef={fileInputRef}
								onFileSelect={handleFileSelect}
								onExpirationChange={setExpirationDays}
								onThemeChange={setSelectedTheme}
								onPreview={togglePreview}
								isPreviewOpen={showPreview}
								isPreviewLoading={isPreviewLoading}
								onUpload={handleUpload}
							/>
						)}
					</div>

					{/* Footer - Only visible in centered mode or right pane */}
					<div className="mt-10 text-center text-xs text-text-tertiary opacity-60 transition-opacity duration-200 hover:opacity-100">
						Press{" "}
						<span className="bg-white/5 border border-border rounded px-1.5 py-0.5 ml-1.5 text-[10px] align-middle text-text-secondary font-inherit">
							⌘ O
						</span>{" "}
						to browse files
					</div>

					{/* GitHub Link */}
					<div className="flex justify-center mt-4">
						<a
							href="https://github.com/hjinco/mdto"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1.5 text-xs text-text-tertiary no-underline opacity-60 transition-[opacity,color] duration-200 hover:opacity-100 hover:text-text-secondary"
							title="View on GitHub"
						>
							<HugeiconsIcon icon={Github} className="w-4 h-4" />
							<span>GitHub</span>
						</a>
					</div>
				</div>
			</div>

			{import.meta.env.PROD && (
				<Turnstile
					className="self-center hidden"
					sitekey={import.meta.env.VITE_PUBLIC_TURNSTILE_SITE_KEY}
					appearance="interaction-only"
					theme="dark"
					fixedSize
					onVerify={(token) => {
						setTurnstileToken(token);
					}}
					onExpire={() => {
						setTurnstileToken(null);
					}}
					onError={() => {
						setTurnstileToken(null);
					}}
				/>
			)}

			{/* Mobile Preview Dialog */}
			{showPreview && selectedFile && (
				<div className="md:hidden">
					<PreviewDialog
						file={selectedFile}
						theme={selectedTheme}
						expirationDays={expirationDays}
						onClose={closePreview}
					/>
				</div>
			)}
		</>
	);
}
