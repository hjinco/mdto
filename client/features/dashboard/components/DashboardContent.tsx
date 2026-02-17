import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../utils/styles";
import { queryClient, trpc } from "../../../utils/trpc";
import { useNowTick } from "../hooks/useNowTick";
import { PageCard } from "./PageCard";

interface DashboardContentProps {
	username: string;
	isOwner: boolean;
	onUserNotFound?: () => void;
}

export function DashboardContent({
	username,
	isOwner,
	onUserNotFound,
}: DashboardContentProps) {
	const { t } = useTranslation();
	const now = useNowTick({ intervalMs: 60_000 });

	const [filter, setFilter] = useState<"active" | "expired" | "all">("active");

	const {
		data: pages,
		isLoading,
		error,
	} = useQuery(
		isOwner
			? trpc.page.list.queryOptions()
			: trpc.page.listByUsername.queryOptions({ username }),
	);

	useEffect(() => {
		const code = (error as { data?: { code?: string } } | null)?.data?.code;
		if (code === "NOT_FOUND") {
			onUserNotFound?.();
		}
	}, [error, onUserNotFound]);

	const { mutate: deletePage } = useMutation(
		trpc.page.delete.mutationOptions({
			onMutate: (input) => {
				if (!isOwner) return { previous: null };
				const queryOptions = trpc.page.list.queryOptions();
				const previous = queryClient.getQueryData(queryOptions.queryKey);
				queryClient.setQueryData(queryOptions.queryKey, (prev) => {
					if (!prev) return prev;
					return prev.filter((p) => p.id !== input.id);
				});
				return { previous };
			},
			onError: (error, _input, context) => {
				console.error(error);
				if (context?.previous) {
					queryClient.setQueryData(
						trpc.page.list.queryOptions().queryKey,
						context.previous,
					);
				}
			},
		}),
	);

	const showFilterTabs = isOwner;
	const visiblePages = useMemo(() => {
		if (!showFilterTabs) return pages;
		if (filter === "all") return pages;
		if (filter === "expired") {
			return pages?.filter(
				(p) => p.expiresAt !== null && new Date(p.expiresAt).getTime() <= now,
			);
		}
		return pages?.filter(
			(p) => p.expiresAt === null || new Date(p.expiresAt).getTime() > now,
		);
	}, [filter, pages, now, showFilterTabs]);

	const visibleError = error instanceof Error ? error.message : null;

	return (
		<>
			{showFilterTabs && (
				<div className="flex w-fit bg-surface border border-border rounded-md p-0.5 gap-0.5 mb-4">
					{[
						{ value: "active" as const, label: t("dashboard.filter.active") },
						{
							value: "expired" as const,
							label: t("dashboard.filter.expired"),
						},
						{ value: "all" as const, label: t("dashboard.filter.all") },
					].map((opt) => (
						<button
							key={opt.value}
							type="button"
							className={cn(
								"bg-transparent border border-transparent text-text-tertiary text-xs font-medium py-1 px-2.5 rounded cursor-pointer transition-all duration-200 font-sans hover:text-text-secondary",
								filter === opt.value &&
									"bg-surface-highlight! text-text-primary! shadow-option-active border-white/5!",
							)}
							onClick={() => setFilter(opt.value)}
						>
							{opt.label}
						</button>
					))}
				</div>
			)}

			{/* Content */}
			{visibleError && (
				<div className="w-full bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
					{visibleError}
				</div>
			)}

			{isLoading ? (
				<div className="text-sm text-text-tertiary mt-6">
					{t("dashboard.loadingPages")}
				</div>
			) : visiblePages?.length === 0 ? (
				<div className="flex-1 pb-36 flex items-center justify-center">
					<div className="text-sm text-text-tertiary">
						{showFilterTabs && filter === "expired"
							? t("dashboard.noExpiredPagesFound")
							: t("dashboard.noPagesYet")}
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
					{visiblePages?.map((p) => (
						<PageCard
							key={p.id}
							page={p}
							now={now}
							onDelete={deletePage}
							editable={isOwner}
						/>
					))}
				</div>
			)}
		</>
	);
}
