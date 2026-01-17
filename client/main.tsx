import * as React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import { PostHogProvider } from "@posthog/react";
import posthog from "posthog-js";

// 개발 모드가 아닐 때만 PostHog 초기화
if (!import.meta.env.DEV) {
	posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
		api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
		defaults: "2025-11-30",
		person_profiles: "identified_only",
	});
}

createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<PostHogProvider client={posthog}>
			<App />
		</PostHogProvider>
	</React.StrictMode>,
);
