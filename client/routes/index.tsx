import { Github } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { Features } from "../components/Features";
import { LoginModal } from "../components/LoginModal";
import { SuccessView } from "../components/SuccessView";
import { TurnstileWidget } from "../components/TurnstileWidget";
import { UploadView } from "../components/UploadView";
import { UserMenu } from "../components/UserMenu";
import { WarningDialog } from "../components/WarningDialog";
import { useFileSelection } from "../hooks/useFileSelection";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { usePaste } from "../hooks/usePaste";
import { usePreviewState } from "../hooks/usePreviewState";
import { useResizablePane } from "../hooks/useResizablePane";
import { useUpload } from "../hooks/useUpload";
import { authClient } from "../lib/auth-client";
import { cn } from "../utils/styles";

const PreviewPane = lazy(() =>
	import("../components/PreviewPane").then((m) => ({ default: m.PreviewPane })),
);
const PreviewDialog = lazy(() =>
	import("../components/PreviewDialog").then((m) => ({
		default: m.PreviewDialog,
	})),
);

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	const [expirationDays, setExpirationDays] = useState(30);
	const [selectedTheme, setSelectedTheme] = useState("default");
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
	const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);
	const [isUploadLimitDialogOpen, setIsUploadLimitDialogOpen] = useState(false);

	const { data: session } = authClient.useSession();

	useEffect(() => {
		setExpirationDays((prev) => {
			// Logged in: default to Permanent (-1) if user hasn't changed it yet.
			if (session?.user) return prev === 30 ? -1 : prev;
			// Logged out: ensure we don't keep an invalid Permanent selection.
			return prev === -1 ? 30 : prev;
		});
	}, [session?.user]);

	const { selectedFile, fileInputRef, handleFileSelect, clearSelection } =
		useFileSelection();

	const {
		showPreview,
		isPreviewLoading,
		setIsPreviewLoading,
		togglePreview,
		closePreview,
	} = usePreviewState();

	const {
		isUploading,
		uploadedUrl,
		uploadError,
		uploadErrorStatus,
		handleUpload,
		handleReset,
	} = useUpload({
		file: selectedFile,
		expirationDays,
		theme: selectedTheme,
		turnstileToken,
		isAuthenticated: !!session?.user,
		onSuccess: closePreview,
		onClearFile: () => {
			clearSelection();
		},
	});

	useEffect(() => {
		// Show a dedicated guide when user hits the per-user page quota.
		if (uploadErrorStatus === 429) {
			setIsUploadLimitDialogOpen(true);
		}
	}, [uploadErrorStatus]);

	useKeyboardShortcuts({
		onOpenFile: () => fileInputRef.current?.click(),
		onClosePreview: closePreview,
		canOpenFile: !uploadedUrl,
		canClosePreview: showPreview,
	});

	usePaste({
		onPaste: handleFileSelect,
		canPaste: !uploadedUrl,
	});

	const {
		width: previewWidth,
		isResizing,
		startResizing: handleMouseDown,
	} = useResizablePane();

	const handleUploadClick = () => {
		if (!session?.user) {
			setIsWarningDialogOpen(true);
			return;
		}
		handleUpload();
	};

	return (
		<>
			{/* Main Container - Conditional Styles for Split View */}
			<div
				className={cn(
					"relative z-1 w-full flex flex-col items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
					"min-h-screen px-5",
					showPreview &&
						selectedFile &&
						"md:max-w-none md:px-0 md:h-screen md:grid md:items-start md:justify-start",
				)}
				style={
					showPreview && selectedFile
						? {
								gridTemplateColumns: `${previewWidth}% auto 1fr`,
							}
						: undefined
				}
			>
				{/* Left Pane (Preview) - Desktop Only */}
				{selectedFile && (
					<div
						className={cn(
							"hidden h-full w-full overflow-hidden",
							isResizing && "pointer-events-none",
							showPreview && "md:block",
						)}
					>
						<Suspense fallback={null}>
							<PreviewPane
								file={selectedFile}
								theme={selectedTheme}
								expirationDays={expirationDays}
								onClose={closePreview}
								onLoadingChange={setIsPreviewLoading}
							/>
						</Suspense>
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

				<div
					className={cn(
						"w-full flex flex-col items-center justify-center",
						showPreview && "md:h-full md:p-6 md:bg-background",
						// Only apply layout styles when not in preview mode or on mobile
						!(showPreview && selectedFile) && "mx-auto",
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
								isAuthenticated={!!session?.user}
								selectedTheme={selectedTheme}
								isUploading={isUploading}
								uploadError={uploadError}
								fileInputRef={fileInputRef}
								onFileSelect={handleFileSelect}
								onExpirationChange={setExpirationDays}
								onThemeChange={setSelectedTheme}
								onPreview={togglePreview}
								isPreviewOpen={showPreview}
								isPreviewLoading={isPreviewLoading}
								turnstileToken={turnstileToken}
								onUpload={handleUploadClick}
							/>
						)}
					</div>

					{/* Top Right Auth */}
					<div className="absolute top-5 right-5 z-20">
						{session?.user ? (
							<UserMenu user={session.user} />
						) : (
							<button
								type="button"
								onClick={() => setIsLoginModalOpen(true)}
								className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5"
							>
								Log in
							</button>
						)}
					</div>

					{!uploadedUrl && <Features />}

					{/* Footer - Only visible in centered mode or right pane */}
					{!uploadedUrl && (
						<div className="hidden md:block mt-4 text-center text-xs text-text-tertiary opacity-60 transition-opacity duration-200 hover:opacity-100">
							Press{" "}
							<span className="bg-white/5 border border-border rounded px-1.5 py-0.5 ml-1.5 text-[10px] align-middle text-text-secondary font-inherit">
								⌘ O
							</span>{" "}
							to browse files
						</div>
					)}

					{/* GitHub Link */}
					<div
						className={cn(
							"flex justify-center",
							uploadedUrl ? "mt-4" : "mt-4 md:mt-16",
						)}
					>
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

				{import.meta.env.PROD && (
					<div
						className={cn(
							"w-fit fixed top-8 md:top-auto md:bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300",
							turnstileToken && "pointer-events-none opacity-0 invisible -z-50",
						)}
					>
						<TurnstileWidget
							onVerify={setTurnstileToken}
							onExpire={() => setTurnstileToken(null)}
							onError={() => setTurnstileToken(null)}
						/>
					</div>
				)}
			</div>

			{/* Login Modal */}
			<LoginModal
				isOpen={isLoginModalOpen}
				onClose={() => setIsLoginModalOpen(false)}
			/>

			{/* Warning Dialog */}
			<WarningDialog
				isOpen={isWarningDialogOpen}
				onClose={() => setIsWarningDialogOpen(false)}
				onSecondary={() => setIsLoginModalOpen(true)}
				secondaryLabel="Log in"
				onConfirm={() => {
					void handleUpload();
				}}
				title="Warning"
				description="Once created, pages cannot be modified or deleted"
				confirmLabel="OK"
			/>

			{/* Upload limit dialog */}
			<WarningDialog
				isOpen={isUploadLimitDialogOpen}
				onClose={() => setIsUploadLimitDialogOpen(false)}
				onConfirm={() => {
					setIsUploadLimitDialogOpen(false);
					window.location.assign("/dashboard");
				}}
				title="Page limit reached"
				description="You can create up to 10 pages per account. Please wait until older pages expire and are cleaned up, then try again. You can review your pages in the dashboard."
				confirmLabel="Open dashboard"
				tone="warning"
			/>

			{/* Mobile Preview Dialog */}
			{selectedFile && (
				<div className={cn("hidden md:hidden", showPreview && "block")}>
					<Suspense fallback={null}>
						<PreviewDialog
							file={selectedFile}
							theme={selectedTheme}
							expirationDays={expirationDays}
							onClose={closePreview}
						/>
					</Suspense>
				</div>
			)}
		</>
	);
}
