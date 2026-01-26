import { Menu } from "@base-ui/react/menu";
import { Delete02Icon, MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../utils/styles";

const formatDateTime = (ms: number) =>
	new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "2-digit",
		hour: "2-digit",
	}).format(new Date(ms));

export function PageCard({
	page,
	now,
	onDelete,
}: {
	page: {
		id: string;
		path: string;
		title: string;
		description: string;
		expiresAt: string | null;
		createdAt: string;
	};
	now: number;
	onDelete: ({ id }: { id: string }) => void;
}) {
	const { t } = useTranslation();

	const expiresLabel = useMemo(() => {
		if (page.expiresAt === null) return null;

		const expiresAtMs = new Date(page.expiresAt).getTime();
		if (Number.isNaN(expiresAtMs)) return null;

		const diff = expiresAtMs - now;
		const minute = 60_000;
		const hour = 60 * minute;
		const day = 24 * hour;

		if (diff <= 0) return t("dashboard.expired");

		if (diff < hour) {
			const minutes = Math.max(1, Math.ceil(diff / minute));
			return t("dashboard.expiresInMinutes", { count: minutes });
		}
		if (diff < day) {
			const hours = Math.ceil(diff / hour);
			return t("dashboard.expiresInHours", { count: hours });
		}

		const days = Math.ceil(diff / day);
		return t("dashboard.expiresInDays", { count: days });
	}, [page.expiresAt, now, t]);

	return (
		<a
			href={page.path}
			target="_blank"
			rel="noopener noreferrer"
			className={cn(
				"flex flex-col h-full no-underline bg-surface-card border border-border rounded-xl p-4 shadow-card transition-all duration-200",
				"hover:border-[#2a2b30] hover:shadow-card-hover",
			)}
		>
			<div className="flex items-start justify-between gap-3 mb-2">
				<div className="min-w-0">
					<div className="text-sm font-medium text-text-primary truncate">
						{page.title}
					</div>
					{page.description ? (
						<div className="text-[13px] text-text-tertiary mt-1 line-clamp-2 min-h-[2lh]">
							{page.description}
						</div>
					) : (
						<div className="text-[13px] text-text-tertiary mt-1 opacity-60 min-h-[2lh]">
							{t("dashboard.noDescription")}
						</div>
					)}
				</div>

				<div className="shrink-0 flex items-center gap-2">
					<Menu.Root modal={false}>
						<Menu.Trigger
							aria-label="Page actions"
							render={(props) => {
								const { onClick, ...rest } = props;
								return (
									<button
										{...rest}
										type="button"
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											onClick?.(e);
										}}
										className={cn(
											"flex items-center justify-center w-6 h-6 rounded-md transition-colors",
											"text-text-tertiary hover:text-text-primary hover:bg-surface-elevated",
											"data-popup-open:bg-surface-elevated data-popup-open:text-text-primary",
										)}
									>
										<HugeiconsIcon
											icon={MoreVerticalIcon}
											className="w-4 h-4"
										/>
									</button>
								);
							}}
						/>
						<Menu.Portal>
							<Menu.Positioner align="end" sideOffset={4}>
								<Menu.Popup
									className={cn(
										"w-32 bg-surface-elevated border border-border rounded-lg shadow-card p-1",
										"animate-fade-in",
									)}
								>
									<Menu.Item
										onClick={() => onDelete({ id: page.id })}
										className={cn(
											"w-full flex items-center gap-2 px-2 py-1.5 rounded-md",
											"text-xs text-red-400 transition-colors text-left cursor-pointer",
											"data-highlighted:bg-red-500/10 data-highlighted:text-red-300",
										)}
									>
										<HugeiconsIcon
											icon={Delete02Icon}
											className="w-3.5 h-3.5"
										/>
										{t("dashboard.delete")}
									</Menu.Item>
								</Menu.Popup>
							</Menu.Positioner>
						</Menu.Portal>
					</Menu.Root>
				</div>
			</div>

			<div className="flex items-center justify-between gap-3 mt-auto pt-4">
				<div className="text-[11px] text-text-tertiary [font-feature-settings:'tnum'] h-4">
					{expiresLabel}
				</div>
				<div className="text-[11px] text-text-tertiary [font-feature-settings:'tnum']">
					{t("dashboard.created", {
						date: formatDateTime(new Date(page.createdAt).getTime()),
					})}
				</div>
			</div>
		</a>
	);
}
