import insane from "insane";
import { marked } from "marked";

/**
 * Convert Markdown text to HTML
 * @param markdown - Markdown text to convert
 * @returns HTML string
 */
export async function markdownToHtml(markdown: string): Promise<string> {
	const dirtyHtml = await marked.parse(markdown);
	const cleanHtml = insane(dirtyHtml, {
		allowedTags: [
			// Headings
			"h1",
			"h2",
			"h3",
			"h4",
			"h5",
			"h6",
			// Text formatting
			"p",
			"strong",
			"em",
			"u",
			"del",
			"ins",
			// Links and images
			"a",
			"img",
			// Code
			"code",
			"pre",
			// Lists
			"ul",
			"ol",
			"li",
			// Blockquotes
			"blockquote",
			// Tables
			"table",
			"thead",
			"tbody",
			"tr",
			"th",
			"td",
			// Other
			"hr",
			"br",
			"div",
			"span",
		],
		allowedAttributes: {
			a: ["href", "title", "target", "rel"],
			img: ["src", "alt", "title", "width", "height"],
		},
	});
	return cleanHtml;
}
