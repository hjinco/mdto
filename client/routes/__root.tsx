import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import appCss from "../globals.css?url";

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
