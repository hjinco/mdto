import { Dialog } from "@base-ui/react/dialog";
import { Edit01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../utils/styles";
import { queryClient, trpc } from "../../../utils/trpc";

interface ChangeSlugDialogProps {
	id: string;
	isOpen: boolean;
	onClose: () => void;
	currentSlug: string;
	username: string;
}

const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;

export function ChangeSlugDialog({
	id,
	isOpen,
	onClose,
	currentSlug,
	username,
}: ChangeSlugDialogProps) {
	const { t } = useTranslation();
	const [slug, setSlug] = useState(currentSlug);
	const [validationError, setValidationError] = useState<string | null>(null);

	const {
		mutate: changeSlug,
		isPending: isLoading,
		error: mutationError,
		reset: resetMutation,
	} = useMutation(
		trpc.page.changeSlug.mutationOptions({
			onSuccess: (data, variables) => {
				const queryOptions = trpc.page.list.queryOptions();
				queryClient.setQueryData(queryOptions.queryKey, (prev) => {
					if (!prev) return prev;
					return prev.map((p) =>
						p.id === variables.id
							? { ...p, slug: data.slug, path: data.path }
							: p,
					);
				});
				onClose();
			},
		}),
	);

	useEffect(() => {
		if (isOpen) {
			setSlug(currentSlug);
			setValidationError(null);
			resetMutation();
		}
	}, [isOpen, currentSlug, resetMutation]);

	const validateSlug = (value: string) => {
		if (!value) {
			return t("dashboard.changeSlug.validation.empty");
		}
		if (value.length > 64) {
			return t("dashboard.changeSlug.validation.tooLong");
		}
		if (!SLUG_REGEX.test(value)) {
			return t("dashboard.changeSlug.validation.invalidChars");
		}
		return null;
	};

	const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setSlug(value);
		if (value === currentSlug) {
			setValidationError(null);
		} else {
			setValidationError(validateSlug(value));
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const error = validateSlug(slug);
		if (error) {
			setValidationError(error);
			return;
		}

		if (slug !== currentSlug) {
			changeSlug({ id, slug });
		}
	};

	const isError = !!validationError || !!mutationError;
	const errorMessage = validationError || mutationError?.message || null;

	return (
		<Dialog.Root
			open={isOpen}
			onOpenChange={(open) => {
				if (!open && !isLoading) onClose();
			}}
		>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 bg-black/80 z-1000 backdrop-blur-sm animate-fade-in" />
				<Dialog.Viewport className="fixed inset-0 z-1000 flex items-center justify-center p-2.5">
					<Dialog.Popup className="w-full max-w-[400px]">
						<div className="bg-surface border border-border rounded-xl w-full flex flex-col shadow-dialog relative p-6 animate-fade-in">
							<div className="flex items-center justify-center mb-4">
								<div className="w-12 h-12 border border-[#30363d] rounded-full flex items-center justify-center bg-[#161b22] text-text-secondary">
									<HugeiconsIcon icon={Edit01Icon} className="w-6 h-6" />
								</div>
							</div>

							<Dialog.Title className="text-lg font-medium text-text-primary mb-2 text-center">
								{t("dashboard.changeSlug.title")}
							</Dialog.Title>
							<Dialog.Description className="text-sm text-text-secondary text-center mb-6">
								{t("dashboard.changeSlug.description")}
							</Dialog.Description>

							<form onSubmit={handleSubmit} className="flex flex-col gap-4">
								<div className="flex flex-col gap-1.5">
									<div
										className={cn(
											"flex items-center bg-surface-elevated border rounded-lg px-3 py-2.5 text-sm text-text-secondary transition-colors",
											isError ? "border-red-500/50" : "border-border",
										)}
									>
										<span className="shrink-0 select-none">
											{window.location.host}/{username}/
										</span>
										<input
											type="text"
											value={slug}
											onChange={handleSlugChange}
											className="bg-transparent border-none outline-none text-text-primary w-full placeholder:text-text-tertiary"
											placeholder={t("dashboard.changeSlug.placeholder")}
										/>
									</div>
									{errorMessage && (
										<div className="text-[11px] text-red-400 px-1">
											{errorMessage}
										</div>
									)}
								</div>

								<div className="flex gap-2">
									<button
										type="button"
										onClick={onClose}
										disabled={isLoading}
										className={cn(
											"flex-1 bg-surface-highlight hover:bg-[#25262a] text-text-primary",
											"border border-border hover:border-text-tertiary py-2.5 h-10 rounded-lg text-[13px] font-medium cursor-pointer",
											"transition-all duration-200 flex items-center justify-center gap-2",
											"hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
										)}
									>
										{t("common.cancel")}
									</button>
									<button
										type="submit"
										disabled={
											isLoading || slug === currentSlug || !!validationError
										}
										className={cn(
											"flex-1 bg-primary hover:bg-[#4e5ac0] text-white",
											"border border-none py-2.5 h-10 rounded-lg text-[13px] font-medium cursor-pointer",
											"transition-all duration-200 shadow-btn flex items-center justify-center gap-2",
											"hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
										)}
									>
										{isLoading ? t("common.saving") : t("common.save")}
									</button>
								</div>
							</form>
						</div>
					</Dialog.Popup>
				</Dialog.Viewport>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
