import { Tooltip } from "@base-ui/react/tooltip";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { queryClient, trpc } from "../../../utils/trpc";

interface DashboardVisibilityToggleProps {
	username: string;
}

export function DashboardVisibilityToggle({
	username,
}: DashboardVisibilityToggleProps) {
	const { t } = useTranslation();
	const {
		data: visibility,
		isLoading,
		error: visibilityError,
	} = useQuery(trpc.user.dashboardVisibility.queryOptions());

	const {
		mutate: setVisibility,
		isPending,
		error: mutationError,
	} = useMutation(
		trpc.user.setDashboardVisibility.mutationOptions({
			onSuccess: (data) => {
				queryClient.setQueryData(
					trpc.user.dashboardVisibility.queryOptions().queryKey,
					{
						isDashboardPublic: data.isDashboardPublic,
					},
				);
			},
		}),
	);

	const isDashboardPublic = visibility?.isDashboardPublic ?? false;
	const isDisabled = isLoading || isPending;
	const errorMessage =
		visibilityError instanceof Error
			? visibilityError.message
			: mutationError instanceof Error
				? mutationError.message
				: null;

	return (
		<div className="flex flex-col items-end gap-1">
			<button
				type="button"
				onClick={(event) => {
					const target = event.target as HTMLElement;
					if (target.closest("[data-visibility-tooltip-trigger]")) {
						return;
					}

					setVisibility({ isDashboardPublic: !isDashboardPublic });
				}}
				disabled={isDisabled}
				className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-surface-highlight text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
			>
				<Tooltip.Root>
					<Tooltip.Trigger
						render={(props) => (
							<span {...props} data-visibility-tooltip-trigger="true" />
						)}
						delay={0}
						aria-label={t("dashboard.visibility.tooltip", { username })}
						className="inline-flex items-center justify-center text-text-tertiary hover:text-text-primary focus-visible:text-text-primary focus-visible:outline-hidden cursor-help"
					>
						<HugeiconsIcon
							icon={InformationCircleIcon}
							className="w-3.5 h-3.5"
						/>
					</Tooltip.Trigger>
					<Tooltip.Portal>
						<Tooltip.Positioner align="center" side="top" sideOffset={8}>
							<Tooltip.Popup className="max-w-[220px] bg-surface-elevated border border-border-highlight text-text-primary py-2 px-3 rounded-md text-[11px] leading-snug text-center shadow-tooltip z-50 animate-fade-in">
								{t("dashboard.visibility.tooltip", { username })}
							</Tooltip.Popup>
						</Tooltip.Positioner>
					</Tooltip.Portal>
				</Tooltip.Root>
				<span>{t("dashboard.visibility.label")}</span>
				<span className="text-text-primary">
					{isDashboardPublic
						? t("dashboard.visibility.public")
						: t("dashboard.visibility.private")}
				</span>
			</button>
			{errorMessage && (
				<div className="text-[11px] text-red-400 max-w-48 text-right">
					{t("dashboard.visibility.failedToUpdate")}
				</div>
			)}
		</div>
	);
}
