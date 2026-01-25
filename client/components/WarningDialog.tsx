import { Alert01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback } from "react";
import { cn } from "../utils/styles";

type WarningDialogTone = "warning" | "danger";

type WarningDialogBaseProps = {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	description: string;
	confirmLabel: string;
	tone?: WarningDialogTone;
};

type WarningDialogProps =
	| (WarningDialogBaseProps & {
			onSecondary?: never;
			secondaryLabel?: never;
	  })
	| (WarningDialogBaseProps & {
			onSecondary: () => void;
			secondaryLabel: string;
	  });

export function WarningDialog({
	isOpen,
	onClose,
	onSecondary,
	onConfirm,
	title,
	description,
	confirmLabel,
	secondaryLabel,
	tone = "warning",
}: WarningDialogProps) {
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
			if (e.key === "Escape") {
				onClose();
			}
		},
		[onClose],
	);

	if (!isOpen) return null;

	const iconStyles =
		tone === "danger"
			? "bg-red-500/10 border-red-500/20 text-red-500"
			: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500";

	return (
		<div
			className="fixed inset-0 bg-black/80 z-1000 flex items-center justify-center p-2.5 backdrop-blur-sm animate-fade-in"
			onClick={handleOverlayClick}
			onKeyDown={handleOverlayKeyDown}
			role="dialog"
			aria-modal="true"
		>
			<div className="bg-surface border border-border rounded-xl w-full max-w-[400px] flex flex-col shadow-dialog relative p-6">
				<div className="flex items-center justify-center mb-4">
					<div
						className={cn(
							"w-12 h-12 border rounded-full flex items-center justify-center",
							iconStyles,
						)}
					>
						<HugeiconsIcon icon={Alert01Icon} className="w-6 h-6" />
					</div>
				</div>
				<div className="text-lg font-medium text-text-primary mb-2 text-center">
					{title}
				</div>
				<div className="text-sm text-text-secondary text-center mb-6">
					{description}
				</div>

				<div className="flex gap-2">
					{onSecondary && (
						<button
							type="button"
							onClick={() => {
								onClose();
								onSecondary();
							}}
							className={cn(
								"flex-1 bg-surface-highlight hover:bg-[#25262a] text-text-primary",
								"border border-border hover:border-text-tertiary py-2.5 h-10 rounded-lg text-[13px] font-medium cursor-pointer",
								"transition-all duration-200 flex items-center justify-center gap-2",
								"hover:scale-[1.02] active:scale-[0.98]",
							)}
						>
							{secondaryLabel}
						</button>
					)}
					<button
						type="button"
						onClick={() => {
							onClose();
							onConfirm();
						}}
						className={cn(
							"flex-1 bg-primary hover:bg-[#4e5ac0] text-white",
							"border border-none py-2.5 h-10 rounded-lg text-[13px] font-medium cursor-pointer",
							"transition-all duration-200 shadow-btn flex items-center justify-center gap-2",
							"hover:scale-[1.02] active:scale-[0.98]",
						)}
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
