import { Github } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import Turnstile, { useTurnstile } from "react-turnstile";
import { PreviewDialog } from "./components/PreviewDialog";
import { PreviewPane } from "./components/PreviewPane";
import { SuccessView } from "./components/SuccessView";
import { UploadView } from "./components/UploadView";
import { cn } from "./utils/styles";

export function App() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [expirationDays, setExpirationDays] = useState(30);
	const [selectedTheme, setSelectedTheme] = useState("default");
	const [isUploading, setIsUploading] = useState(false);
	const [isPreviewLoading, setIsPreviewLoading] = useState(false);
	const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
	const [showPreview, setShowPreview] = useState(false);
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const turnstile = useTurnstile();

	// Keyboard shortcut
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "o") {
				e.preventDefault();
				if (!uploadedUrl) {
					fileInputRef.current?.click();
				}
			}
			if (e.key === "Escape" && showPreview) {
				setShowPreview(false);
				setIsPreviewLoading(false);
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [uploadedUrl, showPreview]);

	const handleFileSelect = useCallback((file: File) => {
		const fileName = file.name.toLowerCase();
		if (
			!fileName.endsWith(".md") &&
			!fileName.endsWith(".markdown") &&
			!fileName.endsWith(".txt")
		) {
			alert("Please select a .md, .markdown, or .txt file only");
			return;
		}
		setSelectedFile(file);
	}, []);

	const handleUpload = useCallback(async () => {
		if (!selectedFile) return;

		setIsUploading(true);

		try {
			const text = await selectedFile.text();

			const headers: Record<string, string> = { "Content-Type": "text/plain" };
			if (turnstileToken) {
				headers["X-Turnstile-Token"] = turnstileToken;
			}

			const response = await fetch(
				`/api/upload?expiration=${expirationDays}&theme=${selectedTheme}`,
				{
					method: "POST",
					headers,
					body: text,
				},
			);

			const data = await response.json();

			if (response.ok && data.slug) {
				const viewUrl = `${window.location.origin}/${data.slug}`;
				setUploadedUrl(viewUrl);
				setShowPreview(false);
			} else {
				turnstile.reset();
				setTurnstileToken(null);
				throw new Error(data.error || "Failed to create page");
			}
		} catch (error) {
			turnstile.reset();
			setTurnstileToken(null);
			alert(
				`Failed to create page: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		} finally {
			setIsUploading(false);
		}
	}, [selectedFile, expirationDays, selectedTheme, turnstileToken, turnstile]);

	const handleReset = useCallback(() => {
		setSelectedFile(null);
		setUploadedUrl(null);
		setExpirationDays(30);
		setSelectedTheme("default");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}, []);

	return (
		<>
			{/* Main Container - Conditional Styles for Split View */}
			<div
				className={cn(
					"relative z-1 w-full flex flex-col items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
					"min-h-screen w-full max-w-[480px] px-5",
					showPreview &&
						selectedFile &&
						"md:max-w-none md:px-0 md:h-screen md:grid md:grid-cols-2 md:items-start md:justify-start",
				)}
			>
				{/* Left Pane (Preview) - Desktop Only */}
				{showPreview && selectedFile && (
					<div className="hidden md:block h-full w-full overflow-hidden">
						<PreviewPane
							file={selectedFile}
							theme={selectedTheme}
							expirationDays={expirationDays}
							onClose={() => {
								setShowPreview(false);
								setIsPreviewLoading(false);
							}}
							onLoadingChange={setIsPreviewLoading}
						/>
					</div>
				)}

				{/* Right Pane (Upload/Settings) */}
				<div
					className={cn(
						"w-full flex flex-col items-center justify-center",
						showPreview && selectedFile && "md:h-full md:p-6 md:bg-background",
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
								onPreview={() => {
									if (showPreview) {
										setShowPreview(false);
										setIsPreviewLoading(false);
									} else {
										setShowPreview(true);
									}
								}}
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

			<input
				type="file"
				ref={fileInputRef}
				className="hidden"
				accept=".md,.markdown,.txt"
				onClick={(e) => {
					e.currentTarget.value = "";
				}}
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (file) handleFileSelect(file);
				}}
			/>

			{/* Mobile Preview Dialog */}
			{showPreview && selectedFile && (
				<div className="md:hidden">
					<PreviewDialog
						file={selectedFile}
						theme={selectedTheme}
						expirationDays={expirationDays}
						onClose={() => {
							setShowPreview(false);
							setIsPreviewLoading(false);
						}}
					/>
				</div>
			)}
		</>
	);
}
