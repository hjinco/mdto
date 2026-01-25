import { Delete02Icon, MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { UserMenu } from "../components/UserMenu";
import { authClient } from "../lib/auth-client";
import { cn } from "../utils/styles";

export const Route = createFileRoute("/dashboard")({
	component: Dashboard,
});

type DashboardPage = {
	id: string;
	path: string;
	title: string;
	description: string;
	theme: string;
	expiresAt: string | null;
	createdAt: string;
	updatedAt: string;
};

const formatDateTime = (ms: number) =>
	new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "2-digit",
		hour: "2-digit",
	}).format(new Date(ms));

function PageCard({
	page,
	now,
	isDeleting,
	onDelete,
}: {
	page: DashboardPage;
	now: number;
	isDeleting: boolean;
	onDelete: (id: string) => void;
}) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false);
			}
		};

		if (isMenuOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isMenuOpen]);

	const getExpiresLabel = () => {
		if (page.expiresAt === null) return null;

		const expiresAtMs = new Date(page.expiresAt).getTime();
		if (Number.isNaN(expiresAtMs)) return null;

		const diff = expiresAtMs - now;
		const minute = 60_000;
		const hour = 60 * minute;
		const day = 24 * hour;

		if (diff <= 0) return "Expired";

		if (diff < hour) {
			const minutes = Math.max(1, Math.ceil(diff / minute));
			return `Expires in ${minutes}m`;
		}
		if (diff < day) {
			const hours = Math.ceil(diff / hour);
			return `Expires in ${hours}h`;
		}

		const days = Math.ceil(diff / day);
		return `Expires in ${days}d`;
	};

	const expiresLabel = getExpiresLabel();

	return (
		<a
			href={page.path}
			target="_blank"
			rel="noopener noreferrer"
			className={cn(
				"flex flex-col h-full no-underline bg-surface-card border border-border rounded-xl p-4 shadow-card transition-all duration-200",
				"hover:border-[#2a2b30] hover:shadow-card-hover hover:-translate-y-px",
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
							No description
						</div>
					)}
				</div>

				<div className="shrink-0 flex items-center gap-2">
					<div className="relative" ref={menuRef}>
						<button
							type="button"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								setIsMenuOpen(!isMenuOpen);
							}}
							className={cn(
								"flex items-center justify-center w-6 h-6 rounded-md transition-colors",
								"text-text-tertiary hover:text-text-primary hover:bg-surface-elevated",
								isMenuOpen && "bg-surface-elevated text-text-primary",
							)}
						>
							<HugeiconsIcon icon={MoreVerticalIcon} className="w-4 h-4" />
						</button>

						{isMenuOpen && (
							<div className="absolute right-0 top-full mt-1 w-32 bg-surface-elevated border border-border rounded-lg shadow-card p-1 z-10 animate-fade-in origin-top-right">
								<button
									type="button"
									disabled={isDeleting}
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										onDelete(page.id);
										setIsMenuOpen(false);
									}}
									className={cn(
										"w-full flex items-center gap-2 px-2 py-1.5 rounded-md",
										"text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300",
										"transition-colors text-left cursor-pointer",
										isDeleting && "opacity-50 cursor-not-allowed",
									)}
								>
									<HugeiconsIcon icon={Delete02Icon} className="w-3.5 h-3.5" />
									{isDeleting ? "Deleting..." : "Delete"}
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="flex items-center justify-between gap-3 mt-auto pt-4">
				<div className="text-[11px] text-text-tertiary [font-feature-settings:'tnum'] h-4">
					{expiresLabel}
				</div>
				<div className="text-[11px] text-text-tertiary [font-feature-settings:'tnum']">
					Created {formatDateTime(new Date(page.createdAt).getTime())}
				</div>
			</div>
		</a>
	);
}

function Dashboard() {
	const { data: session, isPending } = authClient.useSession();
	const navigate = useNavigate();

	const [pages, setPages] = useState<DashboardPage[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [filter, setFilter] = useState<"active" | "expired" | "all">("active");
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (!isPending && !session) {
			navigate({ to: "/" });
		}
	}, [isPending, session, navigate]);

	useEffect(() => {
		const id = setInterval(() => {
			setNow(Date.now());
		}, 60_000);
		return () => {
			clearInterval(id);
		};
	}, []);

	useEffect(() => {
		if (!session?.user) {
			setPages([]);
			setIsLoading(false);
			setError(null);
			return;
		}

		let cancelled = false;
		const run = async () => {
			setIsLoading(true);
			setError(null);
			try {
				const res = await fetch("/api/pages", { credentials: "include" });
				if (!res.ok) {
					const data = (await res.json().catch(() => null)) as {
						error?: string;
					} | null;
					throw new Error(
						data?.error || `Failed to load pages (${res.status})`,
					);
				}

				const data = (await res.json()) as { pages: DashboardPage[] };
				if (!cancelled) {
					setPages(Array.isArray(data.pages) ? data.pages : []);
				}
			} catch (e) {
				if (!cancelled) {
					setPages([]);
					setError(e instanceof Error ? e.message : "Unknown error");
				}
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		};

		void run();
		return () => {
			cancelled = true;
		};
	}, [session?.user]);

	const visiblePages = useMemo(() => {
		if (filter === "all") return pages;
		if (filter === "expired")
			return pages.filter(
				(p) => p.expiresAt !== null && new Date(p.expiresAt).getTime() <= now,
			);
		return pages.filter(
			(p) => p.expiresAt === null || new Date(p.expiresAt).getTime() > now,
		);
	}, [filter, pages, now]);

	const handleDelete = async (pageId: string) => {
		if (!pageId || deletingId) return;
		setDeletingId(pageId);
		setError(null);
		try {
			const res = await fetch(`/api/pages/${encodeURIComponent(pageId)}`, {
				method: "DELETE",
				credentials: "include",
			});
			if (!res.ok) {
				const data = (await res.json().catch(() => null)) as {
					error?: string;
				} | null;
				throw new Error(data?.error || `Failed to delete page (${res.status})`);
			}
			setPages((prev) => prev.filter((p) => p.id !== pageId));
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to delete page");
		} finally {
			setDeletingId(null);
		}
	};

	if (isPending) {
		return null; // or a loading spinner
	}

	if (!session?.user) {
		return null; // Redirecting...
	}

	return (
		<div className="min-h-screen flex px-5 py-8">
			<div className="w-full flex-1 flex flex-col max-w-5xl mx-auto">
				{/* Top Bar */}
				<div className="flex items-center justify-between mb-10">
					<a href="/" className="no-underline">
						<div className="text-lg font-semibold tracking-[-0.02em] bg-linear-to-b from-white to-[#a0a0a0] bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
							mdto.page
						</div>
					</a>

					<UserMenu user={session.user} />
				</div>

				{/* Header */}
				<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
					<div className="text-xl font-semibold text-text-primary">
						Dashboard
					</div>

					<div className="flex w-fit bg-surface border border-border rounded-md p-0.5 gap-0.5">
						{[
							{ value: "active" as const, label: "Active" },
							{ value: "expired" as const, label: "Expired" },
							{ value: "all" as const, label: "All" },
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
				</div>

				{/* Content */}
				{error && (
					<div className="w-full bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
						{error}
					</div>
				)}

				{isLoading ? (
					<div className="text-sm text-text-tertiary mt-6">Loading pages…</div>
				) : visiblePages.length === 0 ? (
					<div className="flex-1 pb-36 flex items-center justify-center">
						<div className="text-sm text-text-tertiary">
							{filter === "expired" ? "No expired pages found" : "No pages yet"}
						</div>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
						{visiblePages.map((p) => (
							<PageCard
								key={p.id}
								page={p}
								now={now}
								isDeleting={deletingId === p.id}
								onDelete={handleDelete}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
