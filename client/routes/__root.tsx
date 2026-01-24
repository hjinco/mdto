import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import appCss from "../globals.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{ title: "mdto.page – Convert & share Markdown as beautiful HTML & PDF" },
			{
				name: "description",
				content:
					"Convert Markdown to beautiful HTML/PDF pages and share instantly with clean templates — no login required on mdto.page.",
			},
			{
				property: "og:title",
				content: "mdto.page – Convert & share Markdown as beautiful HTML & PDF",
			},
			{
				property: "og:description",
				content:
					"Convert Markdown to beautiful HTML/PDF pages and share instantly with clean templates — no login required on mdto.page.",
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
				content: "mdto.page – Convert & share Markdown as beautiful HTML & PDF",
			},
			{
				name: "twitter:description",
				content:
					"Convert Markdown to beautiful HTML/PDF pages and share instantly with clean templates — no login required on mdto.page.",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "canonical",
				href: "https://mdto.page",
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

function RootLayout() {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<Outlet />
				<Scripts />
			</body>
		</html>
	);
}
