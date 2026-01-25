import {
	Alert01Icon,
	Eye,
	File,
	InformationCircleIcon,
	Upload,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { RefObject } from "react";
import { useCallback, useEffect, useState } from "react";
import { useMetaSymbol } from "../hooks/useMetaSymbol";
import { cn } from "../utils/styles";

interface UploadViewProps {
	selectedFile: File | null;
	expirationDays: number;
	isAuthenticated: boolean;
	selectedTheme: string;
	isUploading: boolean;
	uploadError: string | null;
	fileInputRef: RefObject<HTMLInputElement | null>;
	isPreviewOpen: boolean;
	isPreviewLoading: boolean;
	turnstileToken: string | null;
	onFileSelect: (file: File) => void;
	onExpirationChange: (days: number) => void;
	onThemeChange: (theme: string) => void;
	onPreview: () => void;
	onUpload: () => void;
}

export function UploadView({
	selectedFile,
	expirationDays,
	isAuthenticated,
	selectedTheme,
	isUploading,
	uploadError,
	fileInputRef,
	isPreviewOpen,
	isPreviewLoading,
	turnstileToken,
	onFileSelect,
	onExpirationChange,
	onThemeChange,
	onPreview,
	onUpload,
}: UploadViewProps) {
	const [isDragover, setIsDragover] = useState(false);
	const metaSymbol = useMetaSymbol();
	const [expirationDate, setExpirationDate] = useState("");
	const isPermanent = expirationDays === -1;

	useEffect(() => {
		if (isPermanent) {
			return;
		}
		const date = new Date();
		date.setDate(date.getDate() + expirationDays);
		const dateStr = date.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
		});
		const timeStr = date.toLocaleTimeString("en-US", {
			hour: "numeric",
			hour12: true,
		});
		setExpirationDate(`Expires on ${dateStr} at ${timeStr}`);
	}, [expirationDays, isPermanent]);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragover(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragover(false);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragover(false);
			const file = e.dataTransfer.files[0];
			if (file) {
				onFileSelect(file);
			}
		},
		[onFileSelect],
	);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				onFileSelect(file);
			}
		},
		[onFileSelect],
	);

	const handleInputClick = useCallback(
		(e: React.MouseEvent<HTMLInputElement>) => {
			e.currentTarget.value = "";
		},
		[],
	);

	const getUploadZoneClasses = () => {
		return cn(
			"bg-surface border border-dashed border-border rounded-lg h-[200px] px-6 text-center cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] relative flex flex-col items-center justify-center",
			isDragover && "border-primary! bg-[rgba(94,106,210,0.08)]! border-solid!",
			selectedFile &&
				!isDragover &&
				"border-solid! border-[rgba(94,106,210,0.5)]! bg-[radial-gradient(circle_at_50%_0%,rgba(94,106,210,0.1),transparent_70%)] bg-no-repeat animate-slide-down-gradient",
		);
	};

	const getIconWrapperClasses = () => {
		return cn(
			"w-10 h-10 bg-surface-elevated border border-border rounded-[10px] mx-auto mb-4 flex items-center justify-center shadow-icon transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] text-text-secondary",
			selectedFile &&
				"bg-primary! border-primary! text-white! scale-105 shadow-icon-selected",
		);
	};

	return (
		<div className="flex flex-col gap-1.5">
			<div
				className={cn(getUploadZoneClasses(), "group relative")}
				onDragOver={handleDragOver}
				onDragEnter={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
			>
				<input
					type="file"
					ref={fileInputRef}
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
					accept=".md,.markdown,.txt"
					onChange={handleInputChange}
					onClick={handleInputClick}
					title=""
				/>
				<div
					className={cn(
						getIconWrapperClasses(),
						!selectedFile &&
							"group-hover:scale-110 group-hover:border-[#333] group-hover:text-text-primary",
					)}
				>
					{selectedFile ? (
						<HugeiconsIcon icon={File} className="w-5 h-5" />
					) : (
						<HugeiconsIcon icon={Upload} className="w-5 h-5" />
					)}
				</div>

				<div className="text-sm font-medium text-text-primary mb-1.5">
					{selectedFile ? selectedFile.name : "Import Markdown"}
				</div>

				<div className="text-[13px] text-text-tertiary leading-relaxed">
					{selectedFile ? (
						<>
							<span className="text-text-primary">
								{(selectedFile.size / 1024).toFixed(2)} KB
							</span>
							<span className="text-text-tertiary"> • Ready to publish</span>
						</>
					) : (
						<>
							Drop your .md file
							<span className="hidden md:inline">
								{" "}
								or paste ({metaSymbol} + V)
							</span>
							<br />
							<span className="opacity-50 text-[11px] mt-1.5 inline-block">
								Maximum 100KB
							</span>
						</>
					)}
				</div>
			</div>

			<div className="block mt-4 px-1">
				<div className="flex justify-between items-baseline mb-2">
					<div className="text-[13px] text-text-secondary font-medium" />
					<div className="flex items-center gap-1">
						<div className="text-[11px] text-text-tertiary [font-feature-settings:'tnum']">
							{isPermanent
								? "Permanent"
								: expirationDate || "Expires on ... at ..."}
						</div>
						<div className="relative inline-flex items-center ml-1 cursor-help align-middle group">
							<HugeiconsIcon
								icon={InformationCircleIcon}
								className="w-3 h-3 text-text-tertiary transition-colors duration-200"
							/>
							<div className="invisible absolute bottom-full left-1/2 -translate-x-1/2 translate-y-1 bg-surface-elevated border border-border-highlight text-text-primary py-2 px-3 rounded-md text-[11px] leading-snug w-max max-w-[200px] text-center shadow-tooltip opacity-0 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none z-100 group-hover:visible group-hover:opacity-100 group-hover:-translate-y-2 after:content-[''] after:absolute after:top-full after:left-1/2 after:-ml-1 after:border-4 after:border-solid after:border-t-border-highlight after:border-x-transparent after:border-b-transparent">
								{isPermanent ? (
									"You can delete it anytime from the dashboard."
								) : (
									<>
										Deletion occurs periodically,
										<br />
										so the exact time may vary.
									</>
								)}
							</div>
						</div>
					</div>
				</div>
				<div className="flex bg-surface border border-border rounded-md p-0.5 gap-0.5">
					{[
						{ value: 1, label: "1 Day" },
						{ value: 7, label: "1 Week" },
						{ value: 30, label: "1 Month" },
						{
							value: -1,
							label: "∞",
							ariaLabel: "Permanent",
							disabled: !isAuthenticated,
							tooltip: !isAuthenticated ? "Login required" : undefined,
						},
					].map((option) => (
						<div key={option.value} className="relative flex-1 group">
							<button
								type="button"
								className={cn(
									"w-full bg-transparent border border-transparent text-text-tertiary text-xs font-medium py-1 px-2.5 rounded transition-all duration-200 font-sans",
									!option.disabled &&
										"cursor-pointer hover:text-text-secondary",
									option.disabled &&
										"cursor-not-allowed text-text-tertiary/60 select-none",
									!option.disabled &&
										expirationDays === option.value &&
										"bg-surface-highlight! text-text-primary! shadow-option-active border-white/5!",
								)}
								disabled={option.disabled}
								aria-disabled={option.disabled ? "true" : undefined}
								aria-label={option.ariaLabel ?? option.label}
								onClick={
									!option.disabled
										? () => onExpirationChange(option.value)
										: undefined
								}
							>
								{option.label}
							</button>
							{option.tooltip && (
								<div className="invisible absolute bottom-full left-1/2 -translate-x-1/2 translate-y-1 bg-surface-elevated border border-border-highlight text-text-primary py-2 px-3 rounded-md text-[11px] leading-snug w-max max-w-[200px] text-center shadow-tooltip opacity-0 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none z-100 group-hover:visible group-hover:opacity-100 group-hover:-translate-y-2 after:content-[''] after:absolute after:top-full after:left-1/2 after:-ml-1 after:border-4 after:border-solid after:border-t-border-highlight after:border-x-transparent after:border-b-transparent">
									{option.tooltip}
								</div>
							)}
						</div>
					))}
				</div>
			</div>

			<div className="block mt-4 px-1">
				<div className="flex justify-between items-baseline mb-2">
					<div className="text-[13px] text-text-secondary font-medium">
						Theme
					</div>
				</div>
				<div className="flex bg-surface border border-border rounded-md p-0.5 gap-0.5">
					{[
						{ value: "default", label: "Default" },
						{ value: "resume", label: "Resume" },
						{ value: "matrix", label: "Matrix" },
					].map((option) => (
						<button
							key={option.value}
							type="button"
							className={cn(
								"bg-transparent border border-transparent text-text-tertiary text-xs font-medium py-1 px-2.5 rounded cursor-pointer transition-all duration-200 font-sans flex-1 hover:text-text-secondary",
								selectedTheme === option.value &&
									"bg-surface-highlight! text-text-primary! shadow-option-active border-white/5!",
							)}
							onClick={() => onThemeChange(option.value)}
						>
							{option.label}
						</button>
					))}
				</div>
			</div>

			<div className="p-1">
				<button
					type="button"
					className="w-full bg-transparent border border-border text-text-secondary py-2.5 h-10 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-200 shadow-none flex items-center justify-center gap-2 mb-2 hover:enabled:bg-surface-highlight hover:enabled:border-text-tertiary hover:enabled:text-text-primary hover:enabled:shadow-[0_2px_4px_rgba(0,0,0,0.1)] disabled:bg-surface disabled:border-border disabled:text-text-tertiary disabled:cursor-not-allowed disabled:opacity-100"
					disabled={!selectedFile}
					onClick={onPreview}
				>
					{isPreviewLoading ? (
						<div className="w-3.5 h-3.5 border-2 border-text-secondary/30 rounded-full border-t-text-secondary animate-spin" />
					) : (
						<>
							<HugeiconsIcon icon={Eye} className="w-3.5 h-3.5 mr-1.5" />
							<span>{isPreviewOpen ? "Close Preview" : "Preview"}</span>
						</>
					)}
				</button>

				<button
					type="button"
					className={cn(
						"w-full bg-linear-to-b from-primary to-[#4e5ac0] border border-white/8 border-t-white/15 text-white py-2.5 h-10 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-200 shadow-btn flex items-center justify-center gap-2",
						"hover:enabled:-translate-y-px hover:enabled:shadow-btn-hover active:enabled:translate-y-0 active:enabled:opacity-90",
						"disabled:bg-surface! disabled:bg-none! disabled:border-border disabled:text-text-tertiary disabled:cursor-not-allowed disabled:opacity-100 disabled:shadow-none",
						isUploading &&
							"bg-surface! bg-none! border-border text-text-tertiary cursor-not-allowed opacity-100 shadow-none",
						uploadError &&
							"bg-red-500/10! border-red-500/50! text-red-500! shadow-none animate-shake",
					)}
					disabled={
						!selectedFile ||
						isUploading ||
						!!uploadError ||
						(import.meta.env.PROD && !turnstileToken)
					}
					onClick={onUpload}
				>
					{isUploading ? (
						<div className="w-3.5 h-3.5 border-2 border-white/30 rounded-full border-t-white animate-spin" />
					) : uploadError ? (
						<>
							<HugeiconsIcon icon={Alert01Icon} className="w-3.5 h-3.5" />
							<span>Try later</span>
						</>
					) : (
						<span>Create Page</span>
					)}
				</button>
			</div>
		</div>
	);
}
