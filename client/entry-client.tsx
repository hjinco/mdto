import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import { PostHogProvider } from "@posthog/react";
import posthog from "posthog-js";

if (typeof window !== "undefined" && !import.meta.env.DEV) {
	posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
		api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
		defaults: "2025-11-30",
		person_profiles: "identified_only",
	});
}

hydrateRoot(
	document.getElementById("root") as HTMLElement,
	<React.StrictMode>
		<PostHogProvider client={posthog}>
			<App />
		</PostHogProvider>
	</React.StrictMode>,
);
