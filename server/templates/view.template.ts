import { createHtmlPage } from "@shared/templates/view.template";

/**
 * Create HTML page for viewing markdown content
 * @param slug - The slug identifier for the page title
 * @param htmlContent - The converted HTML content from markdown
 * @param theme - The theme name to use (default: 'default')
 * @returns Complete HTML page as string
 */
export function createViewHtml(
	slug: string,
	htmlContent: string,
	theme: string = "default",
): string {
	return createHtmlPage(slug, htmlContent, theme);
}
