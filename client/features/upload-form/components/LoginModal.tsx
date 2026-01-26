import { Dialog } from "@base-ui/react/dialog";
import { Github } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslation } from "react-i18next";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/utils/styles";

interface LoginModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
	const { t } = useTranslation();

	const handleGitHubLogin = async () => {
		await authClient.signIn.social({
			provider: "github",
			callbackURL: window.location.origin,
		});
	};

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
					<Dialog.Popup className="w-full max-w-[360px]">
						<div className="bg-surface border border-border rounded-xl w-full flex flex-col shadow-dialog relative p-6 animate-fade-in">
							<Dialog.Title className="text-lg font-medium text-text-primary mb-2 text-center">
								{t("loginModal.title")}
							</Dialog.Title>
							<Dialog.Description className="text-sm text-text-secondary text-center mb-6">
								{t("loginModal.description")}
							</Dialog.Description>

							<button
								type="button"
								onClick={handleGitHubLogin}
								className={cn(
									"w-full bg-[#24292e] hover:bg-[#2f363d] text-white",
									"border border-none py-2.5 h-10 rounded-lg text-[13px] font-medium cursor-pointer",
									"transition-all duration-200 shadow-btn flex items-center justify-center gap-2",
									"hover:scale-[1.02] active:scale-[0.98]",
								)}
							>
								<HugeiconsIcon icon={Github} className="w-4 h-4" />
								<span>{t("loginModal.continueWithGithub")}</span>
							</button>
						</div>
					</Dialog.Popup>
				</Dialog.Viewport>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
