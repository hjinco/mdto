import { Dialog } from "@base-ui/react/dialog";
import { Image01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { LocalImageReference } from "@shared/markdown";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/styles";

export type SelectedLocalImage = {
	originalPath: string;
	file: File;
};

type LocalImageUploadDialogProps = {
	isOpen: boolean;
	references: LocalImageReference[];
	onClose: () => void;
	onConfirm: (images: SelectedLocalImage[]) => void;
};

const IMAGE_ACCEPT_BY_EXTENSION: Record<string, string> = {
	".gif": "image/gif,.gif",
	".jpeg": "image/jpeg,.jpeg",
	".jpg": "image/jpeg,.jpg",
	".png": "image/png,.png",
	".webp": "image/webp,.webp",
};

function getPathFileName(path: string) {
	const fileName = path.split(/[\\/]/).pop() ?? path;
	try {
		return decodeURIComponent(fileName);
	} catch {
		return fileName;
	}
}

function getImageAccept(path: string) {
	const fileName = getPathFileName(path).toLowerCase();
	const extension = fileName.match(/\.[^.]+$/)?.[0];
	return extension
		? (IMAGE_ACCEPT_BY_EXTENSION[extension] ??
				"image/png,image/jpeg,image/gif,image/webp")
		: "image/png,image/jpeg,image/gif,image/webp";
}

export function LocalImageUploadDialog({
	isOpen,
	references,
	onClose,
	onConfirm,
}: LocalImageUploadDialogProps) {
	const { t } = useTranslation();
	const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
	const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		if (!isOpen) {
			setSelectedFiles({});
			setFileErrors({});
		}
	}, [isOpen]);

	const canConfirm = references.every(
		(reference) => selectedFiles[reference.originalPath],
	);
	const selectedCount = useMemo(
		() => Object.keys(selectedFiles).length,
		[selectedFiles],
	);

	return (
		<Dialog.Root
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 bg-black/80 z-1000 backdrop-blur-sm animate-fade-in" />
				<Dialog.Viewport className="fixed inset-0 z-1000 flex items-center justify-center p-2.5">
					<Dialog.Popup className="w-full max-w-[520px]">
						<div className="bg-surface border border-border rounded-xl w-full flex flex-col shadow-dialog relative p-6 animate-fade-in">
							<div className="flex items-center justify-center mb-4">
								<div className="w-12 h-12 border rounded-full flex items-center justify-center bg-primary/10 border-primary/20 text-primary">
									<HugeiconsIcon icon={Image01Icon} className="w-6 h-6" />
								</div>
							</div>

							<Dialog.Title className="text-lg font-medium text-text-primary mb-2 text-center">
								{t("localImages.title")}
							</Dialog.Title>
							<Dialog.Description className="text-sm text-text-secondary text-center mb-5">
								{t("localImages.description")}
							</Dialog.Description>

							<div className="max-h-[320px] overflow-y-auto pr-1 space-y-2">
								{references.map((reference) => {
									const file = selectedFiles[reference.originalPath];
									const expectedFileName = getPathFileName(
										reference.originalPath,
									);
									const error = fileErrors[reference.originalPath];
									return (
										<label
											key={reference.originalPath}
											className="block rounded-lg border border-border bg-surface-card px-3 py-3 cursor-pointer hover:border-text-tertiary transition-colors"
										>
											<div className="text-[12px] text-text-primary font-mono break-all mb-2">
												{reference.originalPath}
											</div>
											<div className="flex items-center justify-between gap-3">
												<span className="min-w-0 truncate text-[12px] text-text-tertiary">
													{file?.name ?? t("localImages.noFile")}
												</span>
												<span className="shrink-0 rounded-md border border-border bg-surface-highlight px-2.5 py-1 text-[12px] text-text-secondary">
													{t("localImages.chooseFile")}
												</span>
											</div>
											{error && (
												<div className="mt-2 text-[12px] text-red-400">
													{error}
												</div>
											)}
											<input
												type="file"
												accept={getImageAccept(reference.originalPath)}
												className="sr-only"
												onChange={(event) => {
													const nextFile = event.currentTarget.files?.[0];
													if (!nextFile) return;
													if (nextFile.name !== expectedFileName) {
														setSelectedFiles((prev) => {
															const {
																[reference.originalPath]: _file,
																...rest
															} = prev;
															return rest;
														});
														setFileErrors((prev) => ({
															...prev,
															[reference.originalPath]: t(
																"localImages.expectedFile",
																{ fileName: expectedFileName },
															),
														}));
														event.currentTarget.value = "";
														return;
													}
													setSelectedFiles((prev) => ({
														...prev,
														[reference.originalPath]: nextFile,
													}));
													setFileErrors((prev) => {
														const {
															[reference.originalPath]: _error,
															...rest
														} = prev;
														return rest;
													});
												}}
											/>
										</label>
									);
								})}
							</div>

							<div className="mt-5 text-center text-[12px] text-text-tertiary">
								{t("localImages.selectedCount", {
									selected: selectedCount,
									total: references.length,
								})}
							</div>

							<div className="flex gap-2 mt-5">
								<Dialog.Close
									render={(props) => (
										<button
											{...props}
											type="button"
											className="flex-1 bg-surface-highlight hover:bg-[#25262a] text-text-primary border border-border hover:border-text-tertiary py-2.5 h-10 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-200"
										>
											{t("localImages.cancel")}
										</button>
									)}
								/>
								<button
									type="button"
									disabled={!canConfirm}
									onClick={() => {
										if (!canConfirm) return;
										onConfirm(
											references.map((reference) => ({
												originalPath: reference.originalPath,
												file: selectedFiles[reference.originalPath] as File,
											})),
										);
									}}
									className={cn(
										"flex-1 bg-primary hover:bg-[#4e5ac0] text-white border border-none py-2.5 h-10 rounded-lg text-[13px] font-medium transition-all duration-200 shadow-btn",
										canConfirm
											? "cursor-pointer"
											: "cursor-not-allowed opacity-50 shadow-none",
									)}
								>
									{t("localImages.confirm")}
								</button>
							</div>
						</div>
					</Dialog.Popup>
				</Dialog.Viewport>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
