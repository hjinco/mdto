import {
	createMarkdownProcessor,
	detectLanguage,
	type MarkdownMetadata,
} from "./processor";

export type { MarkdownMetadata } from "./processor";

export interface MarkdownResult {
	html: string;
	metadata: MarkdownMetadata;
}

/**
 * Convert Markdown text to HTML with metadata extraction.
 * @param markdown - Markdown text to convert.
 * @returns HTML string and extracted metadata.
 */
export async function markdownToHtml(
	markdown: string,
): Promise<MarkdownResult> {
	const metadata: MarkdownMetadata = {};

	detectLanguage(markdown, metadata);

	const processor = createMarkdownProcessor(metadata);
	const file = await processor.process(markdown);

	return {
		html: String(file),
		metadata,
	};
}
