import { PostHogProvider } from "@posthog/react";
import { QueryClientProvider } from "@tanstack/react-query";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import posthog from "posthog-js";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import appCss from "../globals.css?url";
import { initClientLanguage } from "../lib/i18n";
import { queryClient } from "../utils/trpc";

if (import.meta.env.PROD && !import.meta.env.SSR) {
	posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
		api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
		defaults: "2025-11-30",
		person_profiles: "identified_only",
	});
}

const SITE_TITLE =
	"mdto.page – Convert & share Markdown as beautiful HTML & PDF";
const SITE_DESCRIPTION =
	"Convert Markdown to beautiful HTML/PDF pages and share instantly with clean templates — no login required on mdto.page.";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{ title: SITE_TITLE },
			{
				name: "description",
				content: SITE_DESCRIPTION,
			},
			{
				property: "og:title",
				content: SITE_TITLE,
			},
			{
				property: "og:description",
				content: SITE_DESCRIPTION,
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:url",
				content: "https://mdto.page",
			},
			{
				property: "og:site_name",
				content: "mdto.page",
			},
			{
				property: "og:image",
				content: "https://mdto.page/og-image.png",
			},
			{
				name: "twitter:image",
				content: "https://mdto.page/twitter-image.png",
			},
			{
				name: "twitter:card",
				content: "summary",
			},
			{
				name: "twitter:title",
				content: SITE_TITLE,
			},
			{
				name: "twitter:description",
				content: SITE_DESCRIPTION,
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com",
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",
			},
		],
	}),
	component: RootLayout,
	notFoundComponent: () => <div>Not Found</div>,
});

function ClientI18nBootstrap() {
	const { i18n } = useTranslation();

	useEffect(() => {
		const syncHtmlLang = () => {
			document.documentElement.lang = (
				i18n.resolvedLanguage ??
				i18n.language ??
				"en"
			)
				.toLowerCase()
				.replaceAll("_", "-");
		};

		syncHtmlLang();
		i18n.on("languageChanged", syncHtmlLang);

		// Prerender is always English; switch language on the client after mount.
		void initClientLanguage();

		return () => {
			i18n.off("languageChanged", syncHtmlLang);
		};
	}, [i18n]);

	return null;
}

function RootLayout() {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<div className="root">
					<PostHogProvider client={posthog}>
						<QueryClientProvider client={queryClient}>
							<Outlet />
						</QueryClientProvider>
					</PostHogProvider>
					<ClientI18nBootstrap />
				</div>
				<Scripts />
			</body>
		</html>
	);
}
