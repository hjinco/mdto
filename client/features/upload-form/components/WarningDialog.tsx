import { Dialog } from "@base-ui/react/dialog";
import { Alert01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/utils/styles";

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
	const iconStyles =
		tone === "danger"
			? "bg-red-500/10 border-red-500/20 text-red-500"
			: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500";

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
					<Dialog.Popup className="w-full max-w-[400px]">
						<div className="bg-surface border border-border rounded-xl w-full flex flex-col shadow-dialog relative p-6 animate-fade-in">
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

							<Dialog.Title className="text-lg font-medium text-text-primary mb-2 text-center">
								{title}
							</Dialog.Title>
							<Dialog.Description className="text-sm text-text-secondary text-center mb-6">
								{description}
							</Dialog.Description>

							<div className="flex gap-2">
								{onSecondary && (
									<Dialog.Close
										render={(props) => {
											const { onClick, ...rest } = props;
											return (
												<button
													{...rest}
													type="button"
													onClick={(e) => {
														onClick?.(e);
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
											);
										}}
									/>
								)}
								<Dialog.Close
									render={(props) => {
										const { onClick, ...rest } = props;
										return (
											<button
												{...rest}
												type="button"
												onClick={(e) => {
													onClick?.(e);
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
										);
									}}
								/>
							</div>
						</div>
					</Dialog.Popup>
				</Dialog.Viewport>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
