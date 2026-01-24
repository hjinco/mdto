import { Github } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback } from "react";
import { authClient } from "../lib/auth-client";
import { cn } from "../utils/styles";

interface LoginModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
	const handleGitHubLogin = async () => {
		await authClient.signIn.social({
			provider: "github",
			callbackURL: window.location.origin,
		});
	};

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

	return (
		<div
			className="fixed inset-0 bg-black/80 z-1000 flex items-center justify-center p-2.5 backdrop-blur-sm animate-fade-in"
			onClick={handleOverlayClick}
			onKeyDown={handleOverlayKeyDown}
			role="dialog"
			aria-modal="true"
		>
			<div className="bg-surface border border-border rounded-xl w-full max-w-[360px] flex flex-col shadow-dialog relative p-6">
				<div className="text-lg font-medium text-text-primary mb-2 text-center">
					Log in to mdto
				</div>
				<div className="text-sm text-text-secondary text-center mb-6">
					Welcome back! Please log in to continue.
				</div>

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
					<span>Continue with GitHub</span>
				</button>
			</div>
		</div>
	);
}
