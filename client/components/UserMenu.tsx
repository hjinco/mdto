import { Menu } from "@base-ui/react/menu";
import {
	ArrowRight01Icon,
	DashboardSpeed01Icon,
	LanguageCircleIcon,
	Logout01Icon,
	User as UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { authClient, type User } from "../lib/auth-client";
import { changeLanguage } from "../lib/i18n";
import type { SupportedLanguage } from "../lib/language";
import { cn } from "../utils/styles";
import { getResolvedLanguage, LANGUAGE_OPTIONS } from "./LanguageSelect";

interface UserMenuProps {
	user: User;
}

export function UserMenu({ user }: UserMenuProps) {
	const { t, i18n } = useTranslation();
	const currentLanguage = useMemo(
		() => getResolvedLanguage(i18n.language, i18n.resolvedLanguage),
		[i18n.language, i18n.resolvedLanguage],
	);

	const handleLogout = async () => {
		await authClient.signOut();
	};

	return (
		<Menu.Root modal={false}>
			<Menu.Trigger
				className={cn(
					"flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer",
					"text-sm font-medium text-text-secondary hover:text-text-primary",
					"hover:bg-surface-highlight transition-all duration-200",
					"data-popup-open:bg-surface-highlight data-popup-open:text-text-primary",
				)}
			>
				{user.image ? (
					<img
						src={user.image}
						alt={user.name}
						className="w-5 h-5 rounded-full object-cover border border-border"
					/>
				) : (
					<HugeiconsIcon icon={UserIcon} className="w-5 h-5" />
				)}
				<span>{user.name}</span>
			</Menu.Trigger>

			<Menu.Portal>
				<Menu.Positioner align="end" sideOffset={8}>
					<Menu.Popup
						className={cn(
							"z-50 w-48 bg-surface-elevated border border-border rounded-lg shadow-card p-1",
							"animate-fade-in",
						)}
					>
						<div className="px-3 py-2 border-b border-border/50 mb-1">
							<p className="text-xs font-medium text-text-primary truncate">
								{user.name}
							</p>
							<p className="text-[11px] text-text-tertiary truncate">
								{user.email}
							</p>
						</div>

						<Menu.Item
							render={<Link to="/$username" params={{ username: user.name }} />}
							className={cn(
								"w-full flex items-center gap-2 px-3 py-2 rounded-md",
								"text-xs text-text-secondary transition-colors text-left cursor-pointer",
								"data-highlighted:bg-surface-highlight data-highlighted:text-text-primary",
							)}
						>
							<HugeiconsIcon icon={DashboardSpeed01Icon} className="w-4 h-4" />
							{t("userMenu.dashboard")}
						</Menu.Item>

						<Menu.SubmenuRoot>
							<Menu.SubmenuTrigger
								className={cn(
									"w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md",
									"text-xs text-text-secondary transition-colors text-left cursor-pointer",
									"data-highlighted:bg-surface-highlight data-highlighted:text-text-primary",
									"data-popup-open:bg-surface-highlight data-popup-open:text-text-primary",
								)}
							>
								<span className="flex items-center gap-2">
									<HugeiconsIcon
										icon={LanguageCircleIcon}
										className="w-4 h-4"
									/>
									<span>{t("userMenu.language")}</span>
								</span>
								<HugeiconsIcon
									icon={ArrowRight01Icon}
									className="w-3.5 h-3.5"
								/>
							</Menu.SubmenuTrigger>

							<Menu.Portal>
								<Menu.Positioner align="start" side="right" sideOffset={6}>
									<Menu.Popup
										className={cn(
											"z-50 min-w-36 bg-surface-elevated border border-border rounded-lg shadow-card p-1",
											"animate-fade-in",
										)}
									>
										<Menu.RadioGroup
											value={currentLanguage}
											aria-label={t("userMenu.language")}
										>
											{LANGUAGE_OPTIONS.map((option) => (
												<Menu.RadioItem
													key={option.value}
													value={option.value}
													closeOnClick
													onClick={() => {
														void changeLanguage(
															option.value as SupportedLanguage,
														);
													}}
													className={cn(
														"w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md",
														"text-xs text-text-secondary transition-colors text-left cursor-pointer",
														"data-highlighted:bg-surface-highlight data-highlighted:text-text-primary",
														"data-checked:text-text-primary",
													)}
												>
													<span>{option.label}</span>
													<span
														aria-hidden="true"
														className={cn(
															"text-[10px] leading-none text-text-primary transition-opacity",
															currentLanguage === option.value
																? "opacity-100"
																: "opacity-0",
														)}
													>
														●
													</span>
												</Menu.RadioItem>
											))}
										</Menu.RadioGroup>
									</Menu.Popup>
								</Menu.Positioner>
							</Menu.Portal>
						</Menu.SubmenuRoot>

						<div className="h-px bg-border mx-1 my-0.5" />

						<Menu.Item
							onClick={() => {
								void handleLogout();
							}}
							className={cn(
								"w-full flex items-center gap-2 px-3 py-2 rounded-md",
								"text-xs text-text-secondary transition-colors text-left cursor-pointer",
								"data-highlighted:bg-surface-highlight data-highlighted:text-text-primary",
							)}
						>
							<HugeiconsIcon icon={Logout01Icon} className="w-4 h-4" />
							{t("userMenu.logOut")}
						</Menu.Item>
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
		</Menu.Root>
	);
}
