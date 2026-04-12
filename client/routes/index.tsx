import { Github } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { getApiDocsHref } from "@shared/docs/api-docs";
import { ViewTemplate } from "@shared/templates/view.template";
import type { ThemeId } from "@shared/themes/theme-registry";
import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PreviewDialog } from "@/features/upload-form/components/PreviewDialog";
import { PreviewPane } from "@/features/upload-form/components/PreviewPane";
import { LanguageSelect } from "../components/LanguageSelect";
import { UserMenu } from "../components/UserMenu";
import { Features } from "../features/upload-form/components/Features";
import { LoginModal } from "../features/upload-form/components/LoginModal";
import type { ParsedMarkdown } from "../features/upload-form/components/MarkdownParser";
import { SuccessView } from "../features/upload-form/components/SuccessView";
import { TurnstileWidget } from "../features/upload-form/components/TurnstileWidget";
import { UploadView } from "../features/upload-form/components/UploadView";
import { WarningDialog } from "../features/upload-form/components/WarningDialog";
import { useFileSelection } from "../features/upload-form/hooks/useFileSelection";
import { useKeyboardShortcuts } from "../features/upload-form/hooks/useKeyboardShortcuts";
import { useMarkdownDraftPersistence } from "../features/upload-form/hooks/useMarkdownDraftPersistence";
import { usePaste } from "../features/upload-form/hooks/usePaste";
import { usePreviewState } from "../features/upload-form/hooks/usePreviewState";
import { useResizablePane } from "../features/upload-form/hooks/useResizablePane";
import { useUpload } from "../features/upload-form/hooks/useUpload";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { authClient } from "../lib/auth-client";
import { cn } from "../utils/styles";

const MarkdownParser = lazy(() =>
	import("../features/upload-form/components/MarkdownParser").then((m) => ({
		default: m.MarkdownParser,
	})),
);

const SITE_ORIGIN = "https://mdto.page";
const PDF_IFRAME_CLEANUP_TIMEOUT_MS = 5000;
function printHtmlDocument(html: string, onPrintInitiated?: () => void): void {
	const iframe = document.createElement("iframe");
	iframe.setAttribute("aria-hidden", "true");
	iframe.style.position = "fixed";
	iframe.style.right = "0";
	iframe.style.bottom = "0";
	iframe.style.width = "0";
	iframe.style.height = "0";
	iframe.style.border = "0";
	iframe.style.opacity = "0";
	iframe.style.pointerEvents = "none";
	let hasNotifiedPrintInitiated = false;
	const notifyPrintInitiated = () => {
		if (hasNotifiedPrintInitiated) {
			return;
		}
		hasNotifiedPrintInitiated = true;
		onPrintInitiated?.();
	};
	const cleanupIframe = () => {
		iframe.remove();
	};

	iframe.onerror = () => {
		notifyPrintInitiated();
		cleanupIframe();
	};

	iframe.onload = () => {
		const frameWindow = iframe.contentWindow;
		if (!frameWindow) {
			notifyPrintInitiated();
			cleanupIframe();
			return;
		}
		const cleanupAfterPrint = () => {
			frameWindow.removeEventListener("afterprint", cleanupAfterPrint);
			cleanupIframe();
		};
		frameWindow.addEventListener("afterprint", cleanupAfterPrint);
		notifyPrintInitiated();
		frameWindow.focus();
		frameWindow.print();
		window.setTimeout(cleanupAfterPrint, PDF_IFRAME_CLEANUP_TIMEOUT_MS);
	};

	iframe.srcdoc = html;
	document.body.appendChild(iframe);
}

export const Route = createFileRoute("/")({
	head: () => ({
		links: [{ rel: "canonical", href: SITE_ORIGIN }],
	}),
	component: Home,
});

function Home() {
	const { t, i18n } = useTranslation();
	const [isHomeReady, setIsHomeReady] = useState(false);
	const [expirationDays, setExpirationDays] = useState(30);
	const [selectedTheme, setSelectedTheme] = useState<ThemeId>("default");
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
	const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);
	const [isUploadLimitDialogOpen, setIsUploadLimitDialogOpen] = useState(false);
	const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
	const [parsedMarkdown, setParsedMarkdown] = useState<ParsedMarkdown | null>(
		null,
	);
	const [isParsingMarkdown, setIsParsingMarkdown] = useState(false);
	const isMobile = useMediaQuery("(max-width: 767px)");

	const { data: session } = authClient.useSession();

	useEffect(() => {
		setIsHomeReady(true);
	}, []);

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

	useEffect(() => {
		if (!selectedFile) {
			setParsedMarkdown(null);
			setIsParsingMarkdown(false);
		}
	}, [selectedFile]);

	const { clearDraft } = useMarkdownDraftPersistence({
		selectedFile,
		onRestoreFile: handleFileSelect,
	});

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
		onSuccess: () => {
			clearDraft();
			closePreview();
		},
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

	const hasWikiLink =
		!isParsingMarkdown && parsedMarkdown?.metadata.hasWikiLink === true;
	const canGeneratePdf =
		!!selectedFile && !!parsedMarkdown && !isParsingMarkdown;

	const handleUploadClick = () => {
		if (!session?.user) {
			setIsWarningDialogOpen(true);
			return;
		}
		handleUpload();
	};

	const handleGeneratePdf = () => {
		if (
			!canGeneratePdf ||
			!parsedMarkdown ||
			!selectedFile ||
			isGeneratingPdf
		) {
			return;
		}

		setIsGeneratingPdf(true);
		const expirationTime =
			expirationDays === -1
				? undefined
				: (Date.now() + expirationDays * 24 * 60 * 60 * 1000).toString();

		const printHtml = ViewTemplate({
			lang: parsedMarkdown.metadata.lang,
			title: selectedFile.name,
			description: parsedMarkdown.metadata.description,
			expiresAt: expirationTime,
			html: parsedMarkdown.html,
			theme: selectedTheme,
			markdown: parsedMarkdown.markdown,
			hasKatex: parsedMarkdown.metadata.hasKatex,
			hasMermaid: parsedMarkdown.metadata.hasMermaid,
		});

		printHtmlDocument(printHtml.toString(), () => {
			setIsGeneratingPdf(false);
		});
	};

	return (
		<>
			<div
				data-testid="home-ready"
				data-ready={isHomeReady ? "true" : "false"}
				className="hidden"
				aria-hidden="true"
			/>
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
				{selectedFile && (
					<Suspense fallback={null}>
						<MarkdownParser
							file={selectedFile}
							onParsed={setParsedMarkdown}
							onLoadingChange={setIsParsingMarkdown}
						/>
					</Suspense>
				)}

				{/* Left Pane (Preview) - Desktop Only */}
				{selectedFile && (
					<div
						className={cn(
							"hidden h-full w-full overflow-hidden",
							isResizing && "pointer-events-none",
							showPreview && "md:block",
						)}
					>
						<PreviewPane
							parsed={parsedMarkdown}
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

				<div
					className={cn(
						"w-full flex flex-col items-center justify-center",
						showPreview && "md:h-full md:p-6 md:bg-background",
						// Only apply layout styles when not in preview mode or on mobile
						!(showPreview && selectedFile) && "mx-auto",
					)}
				>
					{/* Logo */}
					<div className="flex items-center justify-center mb-6 opacity-100">
						<div className="text-lg font-semibold tracking-[-0.02em] bg-linear-to-b from-white to-[#a0a0a0] bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
							mdto.page
						</div>
					</div>

					{/* API Banner */}
					{!uploadedUrl && (
						<a
							href={getApiDocsHref(i18n.language)}
							target="_blank"
							rel="noreferrer"
							className="mb-8 px-4 py-2 rounded-full bg-surface-card border border-border text-sm text-text-secondary hover:text-text-primary hover:border-[#2a2b30] hover:shadow-card-hover transition-all flex items-center gap-2"
						>
							<span className="text-[10px] uppercase font-bold text-[#a0a0a0] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded leading-none">
								{t("home.new")}
							</span>
							<span>{t("home.apiBanner")}</span>
						</a>
					)}

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
								hasWikiLink={hasWikiLink}
								fileInputRef={fileInputRef}
								onFileSelect={handleFileSelect}
								onExpirationChange={setExpirationDays}
								onThemeChange={setSelectedTheme}
								onPreview={togglePreview}
								isPreviewOpen={showPreview}
								isPreviewLoading={isPreviewLoading}
								isParsingMarkdown={isParsingMarkdown}
								isGeneratingPdf={isGeneratingPdf}
								canGeneratePdf={canGeneratePdf}
								turnstileToken={turnstileToken}
								onUpload={handleUploadClick}
								onGeneratePdf={() => {
									handleGeneratePdf();
								}}
							/>
						)}
					</div>

					{/* Top Right Auth */}
					<div className="absolute top-5 right-5 z-20">
						<div className="flex items-center gap-2">
							{session?.user ? (
								<UserMenu user={session.user} />
							) : (
								<LanguageSelect />
							)}
							{session?.user ? null : (
								<button
									type="button"
									onClick={() => setIsLoginModalOpen(true)}
									className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5 cursor-pointer"
								>
									{t("auth.login")}
								</button>
							)}
						</div>
					</div>

					{!uploadedUrl && <Features />}

					{/* Footer - Only visible in centered mode or right pane */}
					{!uploadedUrl && (
						<div className="hidden md:block mt-4 text-center text-xs text-text-tertiary opacity-60 transition-opacity duration-200 hover:opacity-100">
							{t("home.browseFilesHint", { shortcut: "⌘ O" })}
						</div>
					)}

					{/* Footer Links (Terms, Privacy, GitHub) */}
					<div
						className={cn(
							"flex items-center justify-center gap-3",
							uploadedUrl ? "mt-8" : "mt-4 md:mt-16",
						)}
					>
						<Link
							to="/terms"
							className="text-xs text-text-tertiary no-underline opacity-60 transition-[opacity,color] duration-200 hover:opacity-100 hover:text-text-secondary"
						>
							{t("nav.terms")}
						</Link>
						<span className="select-none opacity-30 text-[10px] text-text-tertiary">
							•
						</span>
						<Link
							to="/privacy"
							className="text-xs text-text-tertiary no-underline opacity-60 transition-[opacity,color] duration-200 hover:opacity-100 hover:text-text-secondary"
						>
							{t("nav.privacy")}
						</Link>
						<span className="select-none opacity-30 text-[10px] text-text-tertiary">
							•
						</span>
						<a
							href="https://github.com/hjinco/mdto"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1.5 text-xs text-text-tertiary no-underline opacity-60 transition-[opacity,color] duration-200 hover:opacity-100 hover:text-text-secondary"
							title={t("footer.viewOnGithub")}
						>
							<HugeiconsIcon icon={Github} className="w-4 h-4" />
							<span>{t("footer.github")}</span>
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
				secondaryLabel={t("auth.login")}
				onConfirm={() => {
					void handleUpload();
				}}
				title={t("dialogs.warningTitle")}
				description={t("dialogs.warningDescription")}
				confirmLabel={t("dialogs.ok")}
			/>

			{/* Upload limit dialog */}
			<WarningDialog
				isOpen={isUploadLimitDialogOpen}
				onClose={() => setIsUploadLimitDialogOpen(false)}
				onConfirm={() => {
					setIsUploadLimitDialogOpen(false);
					if (session?.user?.name) {
						window.location.assign(`/${session.user.name}`);
						return;
					}
					window.location.assign("/");
				}}
				title={t("dialogs.pageLimitTitle")}
				description={t("dialogs.pageLimitDescription")}
				confirmLabel={t("dialogs.openDashboard")}
				tone="warning"
			/>

			{/* Mobile Preview Dialog */}
			{selectedFile && isMobile && showPreview && (
				<PreviewDialog
					parsed={parsedMarkdown}
					theme={selectedTheme}
					expirationDays={expirationDays}
					onClose={closePreview}
				/>
			)}
		</>
	);
}
