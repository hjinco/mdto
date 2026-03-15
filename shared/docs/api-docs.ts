export const SITE_ORIGIN = "https://mdto.page";
export const API_DOCS_DEFAULT_LOCALE = "en";

export type ApiDocsLocale = "en" | "ko-kr" | "zh-cn";

export type ApiDocsPage = {
	locale: ApiDocsLocale;
	lang: string;
	sourcePath: string;
	outputPath: string;
	publicPath: string;
};

export type ApiDocsAlternateLink = {
	hreflang: string;
	href: string;
};

export const apiDocsPages: ApiDocsPage[] = [
	{
		locale: "en",
		lang: "en",
		sourcePath: "docs/api-v1.en.md",
		outputPath: "docs/api-v1.html",
		publicPath: "/docs/api-v1.html",
	},
	{
		locale: "ko-kr",
		lang: "ko-KR",
		sourcePath: "docs/api-v1.ko-kr.md",
		outputPath: "docs/ko-kr/api-v1.html",
		publicPath: "/docs/ko-kr/api-v1.html",
	},
	{
		locale: "zh-cn",
		lang: "zh-CN",
		sourcePath: "docs/api-v1.zh-cn.md",
		outputPath: "docs/zh-cn/api-v1.html",
		publicPath: "/docs/zh-cn/api-v1.html",
	},
];

function normalizeLocale(locale?: string): ApiDocsLocale {
	const normalized = locale?.toLowerCase().replaceAll("_", "-").trim();

	if (!normalized) {
		return API_DOCS_DEFAULT_LOCALE;
	}

	if (normalized.startsWith("ko")) {
		return "ko-kr";
	}

	if (normalized.startsWith("zh")) {
		return "zh-cn";
	}

	return API_DOCS_DEFAULT_LOCALE;
}

export function getApiDocsPage(locale?: string): ApiDocsPage {
	const normalized = normalizeLocale(locale);
	return (
		apiDocsPages.find((page) => page.locale === normalized) ?? apiDocsPages[0]
	);
}

export function getApiDocsHref(locale?: string): string {
	return getApiDocsPage(locale).publicPath;
}

export function getApiDocsAlternateLinks(): ApiDocsAlternateLink[] {
	const links: ApiDocsAlternateLink[] = apiDocsPages.map((page) => ({
		hreflang: page.locale,
		href: `${SITE_ORIGIN}${page.publicPath}`,
	}));

	links.push({
		hreflang: "x-default",
		href: `${SITE_ORIGIN}${getApiDocsHref(API_DOCS_DEFAULT_LOCALE)}`,
	});

	return links;
}
