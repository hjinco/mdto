import { Dialog } from "@base-ui/react/dialog";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../utils/styles";

type ApiKeyRecord = {
	id: string;
	name: string | null;
	start: string | null;
	prefix: string | null;
	createdAt: string;
};

type ApiKeyListResponse = {
	apiKeys: ApiKeyRecord[];
	total: number;
	limit?: number | null;
	offset?: number | null;
};

type CreatedApiKey = ApiKeyRecord & {
	key: string;
};

async function apiKeyRequest<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`/api/auth${path}`, {
		...init,
		credentials: "include",
		headers: {
			"content-type": "application/json",
			...(init?.headers ?? {}),
		},
	});

	if (!response.ok) {
		const error = (await response.json().catch(() => null)) as {
			message?: string;
		} | null;
		throw new Error(error?.message || "Request failed");
	}

	return response.json<T>();
}

function formatDate(isoString: string, locale: string) {
	return new Intl.DateTimeFormat(locale, {
		year: "numeric",
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(isoString));
}

interface ApiKeyModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
	const { t, i18n } = useTranslation();
	const [name, setName] = useState("");
	const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
	const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);

	useEffect(() => {
		if (copyState !== "copied") {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setCopyState("idle");
		}, 1500);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [copyState]);

	const handleClose = () => {
		setCopyState("idle");
		setCreatedKey(null);
		onClose();
	};

	const apiKeysQuery = useQuery({
		queryKey: ["api-keys"],
		queryFn: () => apiKeyRequest<ApiKeyListResponse>("/api-key/list"),
		enabled: isOpen, // Only fetch when modal is open
	});
	const apiKeys = apiKeysQuery.data?.apiKeys ?? [];

	const createApiKeyMutation = useMutation({
		mutationFn: (payload: { name: string }) =>
			apiKeyRequest<CreatedApiKey>("/api-key/create", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		onSuccess: async (data) => {
			setCreatedKey(data);
			setName("");
			await apiKeysQuery.refetch();
		},
	});

	const deleteApiKeyMutation = useMutation({
		mutationFn: (keyId: string) =>
			apiKeyRequest<{ success: boolean }>("/api-key/delete", {
				method: "POST",
				body: JSON.stringify({ keyId }),
			}),
		onSuccess: async () => {
			await apiKeysQuery.refetch();
		},
	});

	const handleCopy = async () => {
		if (!createdKey?.key) return;
		await navigator.clipboard.writeText(createdKey.key);
		setCopyState("copied");
	};

	return (
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
				<Dialog.Viewport className="fixed inset-0 z-1000 flex items-center justify-center p-4 sm:p-6">
					<Dialog.Popup className="w-full max-w-[500px] max-h-[85vh] flex flex-col bg-surface border border-border rounded-2xl shadow-dialog animate-fade-in relative">
						<div className="flex items-center justify-between p-5 pb-4 shrink-0">
							<div>
								<Dialog.Title className="text-base font-semibold text-text-primary">
									{t("dashboard.apiKeys.title")}
								</Dialog.Title>
								<Dialog.Description className="mt-1 text-sm text-text-tertiary">
									{t("dashboard.apiKeys.description")}
								</Dialog.Description>
							</div>
							<button
								type="button"
								onClick={handleClose}
								className="p-2 -mr-2 text-text-tertiary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-highlight"
								aria-label="Close"
							>
								<HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
							</button>
						</div>

						<div className="px-5 pb-5 overflow-y-auto flex-1 flex flex-col gap-6">
							<div className="flex flex-col gap-2">
								<div className="flex gap-2">
									<input
										type="text"
										value={name}
										onChange={(event) => setName(event.target.value)}
										placeholder={t("dashboard.apiKeys.namePlaceholder")}
										className={cn(
											"w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none transition-colors",
											"focus:border-[#3a3c45]",
										)}
										onKeyDown={(e) => {
											if (
												e.key === "Enter" &&
												!createApiKeyMutation.isPending
											) {
												createApiKeyMutation.mutate({
													name:
														name.trim() || t("dashboard.apiKeys.defaultName"),
												});
											}
										}}
									/>
									<button
										type="button"
										onClick={() =>
											createApiKeyMutation.mutate({
												name: name.trim() || t("dashboard.apiKeys.defaultName"),
											})
										}
										disabled={createApiKeyMutation.isPending}
										className={cn(
											"rounded-xl bg-surface-highlight px-4 py-2.5 text-sm font-medium text-text-primary transition-colors shrink-0",
											"hover:bg-[#2c2f37] disabled:cursor-not-allowed disabled:opacity-60",
										)}
									>
										{createApiKeyMutation.isPending
											? t("dashboard.apiKeys.creating")
											: t("dashboard.apiKeys.create")}
									</button>
								</div>
								{createApiKeyMutation.error && (
									<div className="text-xs text-red-400 mt-1">
										{createApiKeyMutation.error.message}
									</div>
								)}
							</div>

							{createdKey && (
								<div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex flex-col gap-3">
									<div>
										<div className="text-xs font-medium uppercase tracking-[0.14em] text-emerald-300">
											{t("dashboard.apiKeys.createdTitle")}
										</div>
										<p className="mt-1 text-sm text-emerald-100">
											{t("dashboard.apiKeys.createdDescription")}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<div className="flex-1 overflow-x-auto rounded-lg bg-black/20 px-3 py-2 font-mono text-xs text-emerald-100 whitespace-nowrap scrollbar-none">
											{createdKey.key}
										</div>
										<button
											type="button"
											onClick={handleCopy}
											className="shrink-0 rounded-lg bg-emerald-400/20 px-3 py-2 text-xs font-medium text-emerald-100 transition-colors hover:bg-emerald-400/30 cursor-pointer"
										>
											{copyState === "copied"
												? t("dashboard.apiKeys.copied")
												: t("dashboard.apiKeys.copy")}
										</button>
									</div>
								</div>
							)}

							<div className="flex flex-col">
								<div className="mb-2 text-xs font-medium text-text-tertiary">
									{t("dashboard.apiKeys.listTitle")}
								</div>

								{apiKeysQuery.isLoading ? (
									<div className="text-sm text-text-tertiary py-4 text-center">
										{t("dashboard.apiKeys.loading")}
									</div>
								) : apiKeys.length ? (
									<div className="flex flex-col -mx-2">
										{apiKeys.map((key) => (
											<div
												key={key.id}
												className="group flex items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-surface-highlight transition-colors"
											>
												<div className="min-w-0 flex flex-col">
													<div className="text-sm font-medium text-text-primary truncate">
														{key.name || t("dashboard.apiKeys.unnamed")}
													</div>
													<div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-text-tertiary">
														<span className="w-[10ch] shrink-0 truncate font-mono tabular-nums">
															{key.start || key.prefix
																? `${key.start || key.prefix}••••`
																: "n/a"}
														</span>
														<span className="shrink-0">·</span>
														<span className="min-w-0 truncate tabular-nums">
															{formatDate(key.createdAt, i18n.language)}
														</span>
													</div>
												</div>
												<button
													type="button"
													onClick={() => deleteApiKeyMutation.mutate(key.id)}
													disabled={deleteApiKeyMutation.isPending}
													className="opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-lg border border-red-500/20 bg-transparent px-3 py-1.5 text-xs font-medium text-red-300 transition-all hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
												>
													{t("dashboard.apiKeys.revoke")}
												</button>
											</div>
										))}
									</div>
								) : (
									<div className="text-sm text-text-tertiary py-4 text-center border border-dashed border-border rounded-xl">
										{t("dashboard.apiKeys.empty")}
									</div>
								)}
							</div>
						</div>
					</Dialog.Popup>
				</Dialog.Viewport>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
