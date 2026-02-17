import { createFileRoute } from "@tanstack/react-router";
import { UserDashboardPage } from "../features/dashboard/components/UserDashboardPage";

export const Route = createFileRoute("/$username")({
	component: UsernameRoutePage,
});

function UsernameRoutePage() {
	const { username } = Route.useParams();
	return <UserDashboardPage username={username} />;
}
