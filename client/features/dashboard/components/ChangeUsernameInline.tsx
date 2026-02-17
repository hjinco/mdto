import { Dialog } from "@base-ui/react/dialog";
import { Edit01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { authClient } from "../../../lib/auth-client";
import { cn } from "../../../utils/styles";
import { queryClient, trpc } from "../../../utils/trpc";

interface ChangeUsernameInlineProps {
	username: string;
}

const USERNAME_REGEX = /^[a-z0-9_-]{3,32}$/;

function normalizeUsername(value: string) {
	return value.trim().toLowerCase();
}

export function ChangeUsernameInline({ username }: ChangeUsernameInlineProps) {
	const { t } = useTranslation();
	const session = authClient.useSession();
	const navigate = useNavigate();

	const [currentName, setCurrentName] = useState(username);
	const [isOpen, setIsOpen] = useState(false);
	const [draft, setDraft] = useState(username);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setCurrentName(username);
		if (!isOpen) {
			setDraft(username);
		}
	}, [username, isOpen]);

	const normalizedDraft = useMemo(() => normalizeUsername(draft), [draft]);

	const validationError = useMemo(() => {
		if (normalizedDraft.length === 0) {
			return t("dashboard.changeUsername.validation.empty");
		}
		if (normalizedDraft.length < 3) {
			return t("dashboard.changeUsername.validation.tooShort");
		}
		if (normalizedDraft.length > 32) {
			return t("dashboard.changeUsername.validation.tooLong");
		}
		if (!USERNAME_REGEX.test(normalizedDraft)) {
			return t("dashboard.changeUsername.validation.invalidChars");
		}
		return null;
	}, [normalizedDraft, t]);

	const {
		mutate: changeName,
		isPending,
		error: mutationError,
		reset: resetMutation,
	} = useMutation(
		trpc.user.changeName.mutationOptions({
			onMutate: () => {
				return { previousName: currentName };
			},
			onSuccess: (data, _variables, context) => {
				const previousName = context?.previousName ?? currentName;
				const queryOptions = trpc.page.list.queryOptions();
				queryClient.setQueryData(queryOptions.queryKey, (prev) => {
					if (!prev) return prev;

					return prev.map((page) => {
						const parts = page.path.split("/").filter(Boolean);
						if (parts.length !== 2) return page;
						if (parts[0] !== previousName) return page;

						return {
							...page,
							path: `/${data.name}/${parts[1]}`,
						};
					});
				});
				void queryClient.invalidateQueries({
					queryKey: queryOptions.queryKey,
				});
				const previousPublicListQueryOptions =
					trpc.page.listByUsername.queryOptions({
						username: previousName,
					});
				const currentPublicListQueryOptions =
					trpc.page.listByUsername.queryOptions({
						username: data.name,
					});
				queryClient.setQueryData(
					currentPublicListQueryOptions.queryKey,
					(prev) => {
						if (prev) return prev;
						const previous = queryClient.getQueryData(
							previousPublicListQueryOptions.queryKey,
						);
						if (!previous) return previous;

						return previous.map((page) => {
							const parts = page.path.split("/").filter(Boolean);
							if (parts.length !== 2) return page;
							return {
								...page,
								path: `/${data.name}/${parts[1]}`,
							};
						});
					},
				);
				void queryClient.invalidateQueries({
					queryKey: previousPublicListQueryOptions.queryKey,
				});
				void queryClient.invalidateQueries({
					queryKey: currentPublicListQueryOptions.queryKey,
				});
				void session.refetch({
					query: { disableCookieCache: true },
				});
				setCurrentName(data.name);
				setDraft(data.name);
				setIsOpen(false);
				void navigate({
					to: "/$username",
					params: { username: data.name },
					replace: true,
				});
			},
		}),
	);

	useEffect(() => {
		if (isOpen && mutationError && !isPending) {
			inputRef.current?.focus();
		}
	}, [isOpen, isPending, mutationError]);

	const mutationMessage =
		mutationError?.data?.code === "CONFLICT"
			? t("dashboard.changeUsername.validation.taken")
			: mutationError?.message || null;

	const errorMessage = validationError || mutationMessage;
	const canSubmit =
		!isPending && !validationError && normalizedDraft !== currentName;

	const handleOpen = () => {
		setDraft(currentName);
		setIsOpen(true);
		resetMutation();
	};

	const handleClose = () => {
		if (isPending) return;
		setDraft(currentName);
		setIsOpen(false);
		resetMutation();
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSubmit) {
			inputRef.current?.focus();
			return;
		}
		changeName({ name: normalizedDraft });
	};

	if (!currentName) {
		return null;
	}

	return (
		<>
			<div className="inline-flex items-center gap-2 min-w-0">
				<div className="inline-flex items-center min-w-0 text-xl font-semibold text-text-primary">
					<Link to="/" className="no-underline shrink-0">
						<span className="bg-linear-to-b from-white to-[#a0a0a0] bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
							mdto.page
						</span>
					</Link>
					<div className="group/username inline-flex items-center min-w-0">
						<span className="shrink-0">/</span>
						<span className="truncate">{currentName}</span>
						<button
							type="button"
							onClick={handleOpen}
							aria-label={t("dashboard.changeUsername.action")}
							className={cn(
								"flex items-center justify-center w-7 h-7 rounded-md border border-border bg-surface-highlight text-text-tertiary shrink-0 ml-2",
								"opacity-0 group-hover/username:opacity-100 group-focus-within/username:opacity-100 hover:text-text-primary hover:border-text-tertiary",
								"transition-all duration-200 cursor-pointer",
							)}
						>
							<HugeiconsIcon icon={Edit01Icon} className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>

			<Dialog.Root
				open={isOpen}
				onOpenChange={(open) => {
					if (!open) {
						handleClose();
					}
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
									{t("dashboard.changeUsername.title")}
								</Dialog.Title>
								<Dialog.Description className="text-sm text-text-secondary text-center mb-6">
									{t("dashboard.changeUsername.description")}
								</Dialog.Description>

								<form onSubmit={handleSubmit} className="flex flex-col gap-4">
									<div className="flex flex-col gap-1.5">
										<div
											className={cn(
												"flex items-center bg-surface-elevated border rounded-lg px-3 py-2.5 text-sm text-text-secondary transition-colors",
												errorMessage ? "border-red-500/50" : "border-border",
											)}
										>
											<span className="shrink-0 select-none">mdto.page/</span>
											<input
												ref={inputRef}
												type="text"
												value={draft}
												onChange={(e) => setDraft(e.target.value.toLowerCase())}
												onKeyDown={(e) => {
													if (e.key === "Escape") {
														e.preventDefault();
														handleClose();
													}
												}}
												disabled={isPending}
												className="bg-transparent border-none outline-none text-text-primary w-full placeholder:text-text-tertiary"
												placeholder={t("dashboard.changeUsername.placeholder")}
											/>
										</div>
										{errorMessage && (
											<div className="text-[11px] text-red-400 px-1">
												{errorMessage}
											</div>
										)}
										<div className="text-[11px] text-amber-300/90 px-1">
											{t("dashboard.changeUsername.warning")}
										</div>
									</div>

									<div className="flex gap-2">
										<button
											type="button"
											onClick={handleClose}
											disabled={isPending}
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
											disabled={!canSubmit}
											className={cn(
												"flex-1 bg-primary hover:bg-[#4e5ac0] text-white",
												"border border-none py-2.5 h-10 rounded-lg text-[13px] font-medium cursor-pointer",
												"transition-all duration-200 shadow-btn flex items-center justify-center gap-2",
												"hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
											)}
										>
											{isPending ? t("common.saving") : t("common.save")}
										</button>
									</div>
								</form>
							</div>
						</Dialog.Popup>
					</Dialog.Viewport>
				</Dialog.Portal>
			</Dialog.Root>
		</>
	);
}
