import { PostHogProvider } from "@posthog/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { StartClient } from "@tanstack/react-start/client";
import posthog from "posthog-js";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import "./lib/i18n";
import { queryClient } from "./utils/trpc";

if (import.meta.env.PROD) {
	posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
		api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
		defaults: "2025-11-30",
		person_profiles: "identified_only",
	});
}

hydrateRoot(
	document,
	<StrictMode>
		<PostHogProvider client={posthog}>
			<QueryClientProvider client={queryClient}>
				<StartClient />
			</QueryClientProvider>
		</PostHogProvider>
	</StrictMode>,
);
