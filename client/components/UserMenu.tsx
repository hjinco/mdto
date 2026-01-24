import { Logout01Icon, User as UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import { authClient, type User } from "../lib/auth-client";
import { cn } from "../utils/styles";

interface UserMenuProps {
	user: User;
}

export function UserMenu({ user }: UserMenuProps) {
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const handleLogout = async () => {
		await authClient.signOut();
		setIsOpen(false);
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	return (
		<div className="relative" ref={menuRef}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={cn(
					"flex items-center gap-2 px-3 py-1.5 rounded-lg",
					"text-sm font-medium text-text-secondary hover:text-text-primary",
					"hover:bg-surface-highlight transition-all duration-200",
					isOpen && "bg-surface-highlight text-text-primary",
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
			</button>

			{isOpen && (
				<div className="absolute right-0 top-full mt-2 w-48 bg-surface-elevated border border-border rounded-lg shadow-card p-1 z-50 animate-fade-in">
					<div className="px-3 py-2 border-b border-border/50 mb-1">
						<p className="text-xs font-medium text-text-primary truncate">
							{user.name}
						</p>
						<p className="text-[11px] text-text-tertiary truncate">
							{user.email}
						</p>
					</div>
					<button
						type="button"
						onClick={handleLogout}
						className={cn(
							"w-full flex items-center gap-2 px-3 py-2 rounded-md",
							"text-xs text-text-secondary hover:text-text-primary hover:bg-white/5",
							"transition-colors text-left",
						)}
					>
						<HugeiconsIcon icon={Logout01Icon} className="w-4 h-4" />
						Log out
					</button>
				</div>
			)}
		</div>
	);
}
