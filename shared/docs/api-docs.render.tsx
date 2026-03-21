/* @jsxRuntime automatic */
/* @jsxImportSource hono/jsx */
import { markdownToHtml } from "../markdown";
import { ViewTemplate } from "../templates/view.template";
import type { ApiDocsAlternateLink } from "./api-docs";

type RenderApiDocHtmlInput = {
	markdown: string;
	lang: string;
	canonicalUrl: string;
	alternateLinks: ApiDocsAlternateLink[];
};

const defaultTitle = "API v1 – mdto.page";
const defaultDescription =
	"Reference for the mdto.page API v1 page management endpoints.";

export async function renderApiDocHtml({
	markdown,
	lang,
	canonicalUrl,
	alternateLinks,
}: RenderApiDocHtmlInput): Promise<string> {
	const { html, metadata } = await markdownToHtml(markdown);
	const title = (metadata.title || "").trim() || defaultTitle;
	const description = (metadata.description || "").trim() || defaultDescription;

	return `<!DOCTYPE html>${(
		<ViewTemplate
			title={title}
			description={description}
			html={html}
			markdown={markdown}
			lang={lang}
			theme="default"
			canonicalUrl={canonicalUrl}
			alternateLinks={alternateLinks}
		/>
	)}`;
}
