import * as React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import { PostHogProvider } from "@posthog/react";
import posthog from "posthog-js";

if (import.meta.env.PROD) {
	posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
		api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
		defaults: "2025-11-30",
		person_profiles: "identified_only",
	});
}

const Root = (
	<React.StrictMode>
		<PostHogProvider client={posthog}>
			<App />
		</PostHogProvider>
	</React.StrictMode>
);

if (import.meta.env.PROD) {
	hydrateRoot(document.getElementById("root") as HTMLElement, Root);
} else {
	createRoot(document.getElementById("root") as HTMLElement).render(Root);
}
