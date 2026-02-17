import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelect } from "../components/LanguageSelect";
import { UserMenu } from "../components/UserMenu";
import { ChangeUsernameInline } from "../features/dashboard/components/ChangeUsernameInline";
import { DashboardContent } from "../features/dashboard/components/DashboardContent";
import { LoginModal } from "../features/upload-form/components/LoginModal";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/$username")({
	component: UserDashboard,
});

function UserDashboard() {
	const { t } = useTranslation();
	const { username: rawUsername } = Route.useParams();
	const username = rawUsername.trim().toLowerCase();
	const { data: session } = authClient.useSession();
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
	const [notFoundUsername, setNotFoundUsername] = useState<string | null>(null);

	const isOwner = useMemo(() => {
		const sessionUsername = session?.user?.name?.trim().toLowerCase();
		return !!sessionUsername && sessionUsername === username;
	}, [session?.user?.name, username]);

	if (notFoundUsername === username) {
		return <div>Not Found</div>;
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
				<DashboardContent
					username={username}
					isOwner={isOwner}
					onUserNotFound={() => setNotFoundUsername(username)}
				/>
			</div>
			<LoginModal
				isOpen={isLoginModalOpen}
				onClose={() => setIsLoginModalOpen(false)}
			/>
		</div>
	);
}
