import { Link, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelect } from "../../../components/LanguageSelect";
import { UserMenu } from "../../../components/UserMenu";
import { authClient } from "../../../lib/auth-client";
import { LoginModal } from "../../upload-form/components/LoginModal";
import { ChangeUsernameInline } from "./ChangeUsernameInline";
import { DashboardContent } from "./DashboardContent";
import { DashboardVisibilityToggle } from "./DashboardVisibilityToggle";

const USERNAME_REGEX = /^[a-z0-9_-]{3,32}$/;

function normalizeUsername(value: string): string | null {
	const normalized = value.trim().toLowerCase();
	if (!USERNAME_REGEX.test(normalized)) return null;
	return normalized;
}

export function resolveUsernameFromBrowserUrl(): string | null {
	if (typeof window === "undefined") return null;

	const params = new URLSearchParams(window.location.search);
	const searchUsername = params.get("username");
	if (searchUsername) {
		return normalizeUsername(searchUsername);
	}

	const [firstSegment] = window.location.pathname.split("/").filter(Boolean);
	if (!firstSegment || firstSegment.toLowerCase() === "dashboard") {
		return null;
	}

	return normalizeUsername(firstSegment);
}

interface UserDashboardPageProps {
	username: string;
}

export function UserDashboardPage({
	username: rawUsername,
}: UserDashboardPageProps) {
	const { t } = useTranslation();
	const username = normalizeUsername(rawUsername);
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
	const [notFoundUsername, setNotFoundUsername] = useState<string | null>(null);

	const isOwner = useMemo(() => {
		const sessionUsername = session?.user?.name?.trim().toLowerCase();
		return !!username && !!sessionUsername && sessionUsername === username;
	}, [session?.user?.name, username]);

	if (!username || notFoundUsername === username) {
		return <Navigate to="/" />;
	}

	return (
		<div className="min-h-screen flex px-5 py-8">
			<div className="w-full flex-1 flex flex-col max-w-5xl mx-auto">
				<div className="flex items-center justify-between mb-10">
					{isOwner ? (
						<ChangeUsernameInline username={username} />
					) : (
						<div className="inline-flex items-center gap-2 min-w-0">
							<div className="inline-flex items-center min-w-0 text-xl font-semibold text-text-primary">
								<Link to="/" className="no-underline shrink-0">
									<span className="bg-linear-to-b from-white to-[#a0a0a0] bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
										mdto.page
									</span>
								</Link>
								<span className="shrink-0">/</span>
								<span className="truncate">{username}</span>
							</div>
						</div>
					)}

					<div className="flex items-center gap-2">
						{isOwner && <DashboardVisibilityToggle username={username} />}
						<LanguageSelect />
						{session?.user ? (
							<UserMenu user={session.user} />
						) : (
							<button
								type="button"
								onClick={() => setIsLoginModalOpen(true)}
								className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5 cursor-pointer"
							>
								{t("auth.login")}
							</button>
						)}
					</div>
				</div>
				{isSessionPending ? null : (
					<DashboardContent
						username={username}
						isOwner={isOwner}
						onUserNotFound={() => setNotFoundUsername(username)}
					/>
				)}
			</div>
			<LoginModal
				isOpen={isLoginModalOpen}
				onClose={() => setIsLoginModalOpen(false)}
			/>
		</div>
	);
}
