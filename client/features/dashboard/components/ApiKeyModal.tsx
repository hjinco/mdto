import { Dialog } from "@base-ui/react/dialog";
import { getApiDocsHref } from "@shared/docs/api-docs";
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
	const docsHref = getApiDocsHref(i18n.language);

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
				<Dialog.Backdrop className="fixed inset-0 bg-black/40 z-1000 backdrop-blur-[2px] animate-fade-in" />
				<Dialog.Viewport className="fixed inset-0 z-1000 flex items-center justify-center p-4 sm:p-6">
					<Dialog.Popup className="w-full max-w-[520px] max-h-[85vh] flex flex-col bg-surface border border-border rounded-xl shadow-dialog animate-fade-in relative outline-none overflow-hidden">
						{/* Header */}
						<div className="flex flex-col gap-3 px-5 py-5 border-b border-border shrink-0 bg-surface">
							<div className="flex items-center justify-between">
								<Dialog.Title className="text-[15px] font-medium text-text-primary">
									{t("dashboard.apiKeys.title")}
								</Dialog.Title>
							</div>
							<div className="flex items-start gap-4">
								<Dialog.Description className="text-[13px] text-text-tertiary leading-relaxed flex-1">
									{t("dashboard.apiKeys.description")}
								</Dialog.Description>
								<a
									href={docsHref}
									target="_blank"
									rel="noreferrer"
									className="text-[13px] text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-1 shrink-0 mt-0.5"
								>
									{t("dashboard.apiKeys.docsLink")} ↗
								</a>
							</div>
						</div>

						<div className="flex-1 flex flex-col min-h-0 bg-surface">
							{/* Create Section */}
							<div className="p-5 border-b border-border shrink-0 flex flex-col gap-3 bg-surface">
								<div className="flex gap-3">
									<input
										type="text"
										value={name}
										onChange={(event) => setName(event.target.value)}
										placeholder={t("dashboard.apiKeys.namePlaceholder")}
										className={cn(
											"flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-[14px] text-text-primary placeholder:text-text-tertiary outline-none transition-all",
											"focus:border-border-highlight focus:ring-1 focus:ring-border-highlight",
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
											"shrink-0 bg-text-primary text-background px-4 py-2 rounded-lg text-[14px] font-medium transition-all",
											"hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
										)}
									>
										{createApiKeyMutation.isPending
											? t("dashboard.apiKeys.creating")
											: t("dashboard.apiKeys.create")}
									</button>
								</div>
								{createApiKeyMutation.error && (
									<div className="text-[13px] text-danger">
										{createApiKeyMutation.error.message}
									</div>
								)}

								{createdKey && (
									<div className="mt-2 rounded-lg border border-success/30 bg-success/10 p-3 flex flex-col gap-2.5">
										<div className="flex items-center justify-between">
											<div className="text-[13px] font-medium text-success">
												{t("dashboard.apiKeys.createdTitle")}
											</div>
											<div className="text-[13px] text-success/80">
												{t("dashboard.apiKeys.createdDescription")}
											</div>
										</div>
										<div className="flex items-center gap-2">
											<div className="flex-1 overflow-x-auto rounded bg-black/20 px-2.5 py-1.5 font-mono text-[14px] text-success whitespace-nowrap scrollbar-none border border-success/20">
												{createdKey.key}
											</div>
											<button
												type="button"
												onClick={handleCopy}
												className="shrink-0 rounded bg-success/20 px-3 py-1.5 text-[13px] font-medium text-success transition-colors hover:bg-success/30 cursor-pointer"
											>
												{copyState === "copied"
													? t("dashboard.apiKeys.copied")
													: t("dashboard.apiKeys.copy")}
											</button>
										</div>
									</div>
								)}
							</div>

							{/* List Section */}
							<div className="flex-1 overflow-y-auto">
								{apiKeysQuery.isLoading ? (
									<div className="text-[14px] text-text-tertiary py-10 text-center">
										{t("dashboard.apiKeys.loading")}
									</div>
								) : apiKeys.length ? (
									<div className="flex flex-col">
										{apiKeys.map((key) => (
											<div
												key={key.id}
												className="group flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-highlight transition-colors border-b border-border/50 last:border-0"
											>
												<div className="flex items-center gap-4 min-w-0">
													<div className="text-[14px] font-medium text-text-primary truncate min-w-[120px]">
														{key.name || t("dashboard.apiKeys.unnamed")}
													</div>
													<div className="text-[14px] text-text-tertiary font-mono truncate">
														{key.start || key.prefix
															? `${key.start || key.prefix}••••`
															: "n/a"}
													</div>
												</div>
												<div className="flex items-center gap-4 shrink-0">
													<div className="text-[13px] text-text-tertiary tabular-nums">
														{formatDate(key.createdAt, i18n.language)}
													</div>
													<div className="w-[60px] flex justify-end">
														<button
															type="button"
															onClick={() =>
																deleteApiKeyMutation.mutate(key.id)
															}
															disabled={deleteApiKeyMutation.isPending}
															className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-[13px] font-medium text-text-tertiary hover:text-danger transition-colors disabled:cursor-not-allowed disabled:opacity-50 outline-none cursor-pointer"
														>
															{t("dashboard.apiKeys.revoke")}
														</button>
													</div>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="text-[14px] text-text-tertiary py-10 text-center">
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
