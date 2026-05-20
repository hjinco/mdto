import wikiLinkPlugin from "@flowershow/remark-wiki-link";
import type { Root } from "mdast";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

export type LocalImageReferenceKind = "markdown" | "html" | "wikilink";

export type LocalImageReference = {
	originalPath: string;
	kind: LocalImageReferenceKind;
};

const HTML_IMAGE_RE = /<img\b[^>]*\bsrc=(["'])(.*?)\1[^>]*>/gi;

type PositionedNode = {
	type?: string;
	position?: {
		start?: { offset?: number };
		end?: { offset?: number };
	};
};

type ImageNode = PositionedNode & {
	type: "image";
	url?: string;
};

type HtmlNode = PositionedNode & {
	type: "html";
	value?: string;
};

type WikiImageNode = PositionedNode & {
	type: string;
	value?: string;
	data?: {
		path?: string;
		hName?: string;
		hProperties?: {
			src?: string;
		};
	};
};

type LocalImageOccurrence = LocalImageReference & {
	start: number;
	end: number;
};

export type LocalImageReferenceAnalysis = {
	references: LocalImageReference[];
	rewrite: (replacements: Map<string, string>) => string;
};

function normalizeImagePath(path: string) {
	const trimmed = path.trim();
	if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
		return trimmed.slice(1, -1).trim();
	}
	return trimmed;
}

export function isLocalImagePath(path: string) {
	const normalized = normalizeImagePath(path);
	if (!normalized) return false;
	if (normalized.startsWith("#")) return false;
	if (normalized.startsWith("//")) return false;
	if (/^[a-z][a-z0-9+.-]*:/i.test(normalized)) return false;
	return true;
}

function parseMarkdownAst(markdown: string) {
	return unified()
		.use(remarkParse)
		.use(remarkFrontmatter)
		.use(remarkGfm)
		.use(remarkMath)
		.use(wikiLinkPlugin)
		.parse(markdown) as Root;
}

function getNodeOffsets(node: PositionedNode) {
	const start = node.position?.start?.offset;
	const end = node.position?.end?.offset;
	return typeof start === "number" && typeof end === "number"
		? { start, end }
		: null;
}

function findClosingImageLabel(source: string) {
	if (!source.startsWith("![")) return -1;

	let depth = 1;
	let escaped = false;
	for (let index = 2; index < source.length; index += 1) {
		const char = source[index];
		if (escaped) {
			escaped = false;
			continue;
		}
		if (char === "\\") {
			escaped = true;
			continue;
		}
		if (char === "[") {
			depth += 1;
			continue;
		}
		if (char === "]") {
			depth -= 1;
			if (depth === 0) return index;
		}
	}

	return -1;
}

function findMarkdownDestinationRange(source: string) {
	const labelEnd = findClosingImageLabel(source);
	if (labelEnd === -1 || source[labelEnd + 1] !== "(") return null;

	let start = labelEnd + 2;
	while (/\s/.test(source[start] ?? "")) {
		start += 1;
	}

	if (source[start] === "<") {
		const end = source.indexOf(">", start + 1);
		return end === -1 ? null : { start: start + 1, end };
	}

	let escaped = false;
	let parenDepth = 0;
	for (let index = start; index < source.length; index += 1) {
		const char = source[index];
		if (escaped) {
			escaped = false;
			continue;
		}
		if (char === "\\") {
			escaped = true;
			continue;
		}
		if (char === "(") {
			parenDepth += 1;
			continue;
		}
		if (char === ")") {
			if (parenDepth === 0) {
				return index === start ? null : { start, end: index };
			}
			parenDepth -= 1;
		}
		if (/\s/.test(char) && parenDepth === 0) {
			return index === start ? null : { start, end: index };
		}
	}

	return null;
}

function findMarkdownImageUrlRange(
	markdown: string,
	node: ImageNode,
	originalPath: string,
) {
	const offsets = getNodeOffsets(node);
	if (!offsets) return null;

	const source = markdown.slice(offsets.start, offsets.end);
	const range = findMarkdownDestinationRange(source);
	if (!range) return null;

	const targetSource = source.slice(range.start, range.end);
	if (
		normalizeImagePath(targetSource) !== originalPath &&
		targetSource !== node.url
	) {
		return null;
	}

	return {
		start: offsets.start + range.start,
		end: offsets.start + range.end,
	};
}

function getWikiImagePath(node: WikiImageNode) {
	if (node.type !== "embed" && node.type !== "wikiLinkEmbed") return null;
	return node.value ?? node.data?.path ?? node.data?.hProperties?.src ?? null;
}

function collectLocalImageOccurrences(markdown: string) {
	const occurrences: LocalImageOccurrence[] = [];
	const tree = parseMarkdownAst(markdown);

	visit(tree, (node) => {
		const nodeType = (node as { type?: string }).type;

		if (nodeType === "image") {
			const imageNode = node as ImageNode;
			const originalPath = normalizeImagePath(imageNode.url ?? "");
			if (!isLocalImagePath(originalPath)) return;
			const range = findMarkdownImageUrlRange(
				markdown,
				imageNode,
				originalPath,
			);
			if (!range) return;
			occurrences.push({ originalPath, kind: "markdown", ...range });
			return;
		}

		if (nodeType === "html") {
			const htmlNode = node as HtmlNode;
			const offsets = getNodeOffsets(htmlNode);
			if (!offsets || !htmlNode.value) return;

			for (const match of htmlNode.value.matchAll(HTML_IMAGE_RE)) {
				const rawUrl = match[2] ?? "";
				const originalPath = normalizeImagePath(rawUrl);
				if (!isLocalImagePath(originalPath) || match.index === undefined) {
					continue;
				}
				const srcOffsetInMatch = match[0].indexOf(rawUrl);
				if (srcOffsetInMatch === -1) continue;
				const start = offsets.start + match.index + srcOffsetInMatch;
				occurrences.push({
					originalPath,
					kind: "html",
					start,
					end: start + rawUrl.length,
				});
			}
			return;
		}

		const wikiPath = getWikiImagePath(node as WikiImageNode);
		if (!wikiPath) return;
		const originalPath = normalizeImagePath(wikiPath);
		const offsets = getNodeOffsets(node as PositionedNode);
		if (!offsets || !isLocalImagePath(originalPath)) return;
		occurrences.push({ originalPath, kind: "wikilink", ...offsets });
	});

	return occurrences;
}

function toUniqueReferences(occurrences: LocalImageOccurrence[]) {
	const references: LocalImageReference[] = [];
	const seen = new Set<string>();

	for (const occurrence of occurrences) {
		if (seen.has(occurrence.originalPath)) continue;
		seen.add(occurrence.originalPath);
		references.push({
			originalPath: occurrence.originalPath,
			kind: occurrence.kind,
		});
	}

	return references;
}

function rewriteWithOccurrences(
	markdown: string,
	occurrences: LocalImageOccurrence[],
	replacements: Map<string, string>,
) {
	const edits = occurrences
		.map((occurrence) => {
			const uploadedUrl = replacements.get(occurrence.originalPath);
			if (!uploadedUrl) return null;
			return {
				start: occurrence.start,
				end: occurrence.end,
				value:
					occurrence.kind === "wikilink" ? `![](${uploadedUrl})` : uploadedUrl,
			};
		})
		.filter((edit) => edit !== null)
		.sort((a, b) => b.start - a.start);

	let rewritten = markdown;
	for (const edit of edits) {
		rewritten =
			rewritten.slice(0, edit.start) + edit.value + rewritten.slice(edit.end);
	}
	return rewritten;
}

export function analyzeLocalImageReferences(
	markdown: string,
): LocalImageReferenceAnalysis {
	const occurrences = collectLocalImageOccurrences(markdown);
	const references = toUniqueReferences(occurrences);

	return {
		references,
		rewrite(replacements) {
			return rewriteWithOccurrences(markdown, occurrences, replacements);
		},
	};
}

export function findLocalImageReferences(markdown: string) {
	return analyzeLocalImageReferences(markdown).references;
}

export function rewriteLocalImageReferences(
	markdown: string,
	replacements: Map<string, string>,
) {
	return analyzeLocalImageReferences(markdown).rewrite(replacements);
}
