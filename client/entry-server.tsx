import * as React from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App";
import "./styles.css";
import { PostHogProvider } from "@posthog/react";
import posthog from "posthog-js";

export function render(): string {
	return renderToString(
		<React.StrictMode>
			<PostHogProvider client={posthog}>
				<App />
			</PostHogProvider>
		</React.StrictMode>,
	);
}
