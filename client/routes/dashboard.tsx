import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LanguageSelect } from "../components/LanguageSelect";
import { UserMenu } from "../components/UserMenu";
import { DashboardContent } from "../features/dashboard/components/DashboardContent";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const { data: session, isPending } = authClient.useSession();
	const navigate = useNavigate();

	useEffect(() => {
		if (!isPending && !session) {
			navigate({ to: "/", replace: true });
		}
	}, [isPending, session, navigate]);

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
					<Link to="/" className="no-underline">
						<div className="text-lg font-semibold tracking-[-0.02em] bg-linear-to-b from-white to-[#a0a0a0] bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
							mdto.page
						</div>
					</Link>

					<div className="flex items-center gap-2">
						<LanguageSelect />
						<UserMenu user={session.user} />
					</div>
				</div>
				<DashboardContent />
			</div>
		</div>
	);
}
