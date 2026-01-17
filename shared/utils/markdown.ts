import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

/**
 * Convert Markdown text to HTML
 * @param markdown - Markdown text to convert
 * @returns HTML string
 */
export async function markdownToHtml(markdown: string): Promise<string> {
	const processor = unified()
		.use(remarkParse)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw)
		.use(rehypeSanitize)
		.use(rehypeHighlight)
		.use(rehypeSlug)
		.use(rehypeStringify);

	const file = await processor.process(markdown);

	return String(file);
}
