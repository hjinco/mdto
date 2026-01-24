import { PostHogProvider } from "@posthog/react";
import { StartClient } from "@tanstack/react-start/client";
import posthog from "posthog-js";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

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
			<StartClient />
		</PostHogProvider>
	</StrictMode>,
);
