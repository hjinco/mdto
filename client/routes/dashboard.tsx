import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
	resolveUsernameFromBrowserUrl,
	UserDashboardPage,
} from "../features/dashboard/components/UserDashboardPage";

export const Route = createFileRoute("/dashboard")({
	component: DashboardRoutePage,
});

function DashboardRoutePage() {
	const [username, setUsername] = useState<string | null | undefined>(
		undefined,
	);

	useEffect(() => {
		setUsername(resolveUsernameFromBrowserUrl());
	}, []);

	if (username === undefined) {
		return null;
	}

	if (!username) {
		return <Navigate to="/" />;
	}

	return <UserDashboardPage username={username} />;
}
