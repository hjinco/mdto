import wikiLinkPlugin from "@flowershow/remark-wiki-link";
import { franc } from "franc-min";
// biome-ignore lint/suspicious/noTsIgnore: CommonJS module
// @ts-ignore
import iso6393To1 from "iso-639-3-to-1";
import yaml from "js-yaml";
import type { Root } from "mdast";
import { toString as mdastToString } from "mdast-util-to-string";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

export interface MarkdownMetadata {
	lang?: string;
	title?: string;
	description?: string;
	hasKatex?: boolean;
	hasMermaid?: boolean;
	hasCodeBlock?: boolean;
	hasWikiLink?: boolean;
}

const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 160;

function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength - 3).trim()}...`;
}

const yamlHandler = (
	state: {
		patch: (from: unknown, to: unknown) => void;
		applyData: <T>(from: unknown, to: T) => T;
	},
	node: { type: "yaml"; value: string },
) => {
	let data: Record<string, unknown> | null = null;
	try {
		data = yaml.load(node.value) as Record<string, unknown>;
	} catch {
		// If parsing fails, just ignore.
	}

	// biome-ignore lint/suspicious/noExplicitAny: HAST children are loosely typed.
	const children: any[] = [];

	if (data && typeof data === "object") {
		for (const [key, value] of Object.entries(data)) {
			const displayValue =
				value instanceof Date ? value.toLocaleDateString() : String(value);

			children.push({
				type: "element" as const,
				tagName: "div",
				properties: { className: ["frontmatter-row"] },
				children: [
					{
						type: "element" as const,
						tagName: "div",
						properties: { className: ["frontmatter-label"] },
						children: [{ type: "text" as const, value: key }],
					},
					{
						type: "element" as const,
						tagName: "div",
						properties: { className: ["frontmatter-value"] },
						children: [{ type: "text" as const, value: displayValue }],
					},
				],
			});
		}
	}

	if (children.length === 0) {
		const result = {
			type: "text" as const,
			value: "",
		};
		state.patch(node, result);
		return state.applyData(node, result);
	}

	const result = {
		type: "element" as const,
		tagName: "div",
		properties: { className: ["frontmatter-container"] },
		children,
	};
	state.patch(node, result);
	return state.applyData(node, result);
};

const sanitizeSchema = {
	...defaultSchema,
	attributes: {
		...(defaultSchema.attributes || {}),
		div: [
			...(defaultSchema.attributes?.div || []),
			[
				"className",
				"frontmatter-container",
				"frontmatter-row",
				"frontmatter-label",
				"frontmatter-value",
			],
		],
	},
} as typeof defaultSchema;

/**
 * Remark plugin to extract metadata from AST.
 * Extracts: frontmatter title/description, first heading, first paragraph.
 */
function remarkExtractMetadata(metadata: MarkdownMetadata) {
	return (tree: Root) => {
		let foundHeading = false;
		let foundParagraph = false;

		visit(tree, (node) => {
			const nodeType = (node as { type: string }).type;

			// Detect wiki links parsed by @flowershow/remark-wiki-link.
			if (
				nodeType === "wikiLink" ||
				nodeType === "wikiLinkEmbed" ||
				nodeType === "embed"
			) {
				metadata.hasWikiLink = true;
			}

			// Extract from frontmatter (yaml).
			if (nodeType === "yaml") {
				try {
					const yamlNode = node as { value: string };
					const data = yaml.load(yamlNode.value) as Record<string, unknown>;
					if (data && typeof data === "object") {
						if (typeof data.title === "string") {
							metadata.title = data.title;
						}
						if (typeof data.description === "string") {
							metadata.description = data.description;
						}
					}
				} catch {
					// Ignore parsing errors.
				}
			}

			// Fallback: first heading for title.
			if (!metadata.title && !foundHeading && nodeType === "heading") {
				metadata.title = truncate(mdastToString(node), MAX_TITLE_LENGTH);
				foundHeading = true;
			}

			// Fallback: first paragraph for description.
			if (
				!metadata.description &&
				!foundParagraph &&
				nodeType === "paragraph"
			) {
				metadata.description = truncate(
					mdastToString(node),
					MAX_DESCRIPTION_LENGTH,
				);
				foundParagraph = true;
			}

			// Detect KaTeX (math nodes created by remarkMath).
			if (nodeType === "math" || nodeType === "inlineMath") {
				metadata.hasKatex = true;
			}

			// Detect code blocks.
			if (nodeType === "code") {
				const lang = (node as { lang?: string }).lang;
				if (lang === "mermaid") {
					metadata.hasMermaid = true;
				} else {
					metadata.hasCodeBlock = true;
				}
			}
		});
	};
}

export function detectLanguage(markdown: string, metadata: MarkdownMetadata) {
	// Detect language using franc (sample first 300 chars for performance).
	const sample = markdown.slice(0, 300);
	const iso639_3Code = franc(sample);

	// franc returns "und" (undetermined) if detection fails.
	if (iso639_3Code === "und") return;

	// Convert ISO 639-3 to ISO 639-1 for HTML lang attribute.
	const langInfo = iso6393To1(iso639_3Code);
	if (langInfo) {
		metadata.lang = langInfo;
	}
}

export function createMarkdownProcessor(metadata: MarkdownMetadata) {
	return (
		unified()
			.use(remarkParse)
			.use(remarkFrontmatter)
			.use(remarkGfm)
			.use(remarkMath)
			.use(wikiLinkPlugin)
			.use(() => remarkExtractMetadata(metadata))
			// @ts-expect-error - Handler signature is correct but TypeScript cannot infer it.
			.use(remarkRehype, {
				allowDangerousHtml: true,
				handlers: { yaml: yamlHandler },
			})
			.use(rehypeRaw)
			.use(rehypeSanitize, sanitizeSchema)
			.use(rehypeHighlight)
			.use(rehypeKatex)
			.use(rehypeSlug)
			.use(rehypeStringify)
	);
}
