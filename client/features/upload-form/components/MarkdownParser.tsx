import { type MarkdownMetadata, markdownToHtml } from "@shared/markdown";
import { useEffect, useRef } from "react";

export type ParsedMarkdown = {
	markdown: string;
	html: string;
	metadata: MarkdownMetadata;
};

interface MarkdownParserProps {
	file: File | null;
	onParsed: (parsed: ParsedMarkdown | null) => void;
	onLoadingChange: (isLoading: boolean) => void;
}

export function MarkdownParser({
	file,
	onParsed,
	onLoadingChange,
}: MarkdownParserProps) {
	const requestIdRef = useRef(0);

	useEffect(() => {
		if (!file) {
			onLoadingChange(false);
			onParsed(null);
			return;
		}

		requestIdRef.current += 1;
		const requestId = requestIdRef.current;
		let isCancelled = false;

		const parse = async () => {
			try {
				onLoadingChange(true);
				const markdown = await file.text();
				if (isCancelled || requestId !== requestIdRef.current) return;

				const { html, metadata } = await markdownToHtml(markdown);
				if (isCancelled || requestId !== requestIdRef.current) return;

				onParsed({ markdown, html, metadata });
			} catch (error) {
				if (isCancelled || requestId !== requestIdRef.current) return;
				console.error("Failed to parse markdown:", error);
				onParsed(null);
			} finally {
				if (!isCancelled && requestId === requestIdRef.current) {
					onLoadingChange(false);
				}
			}
		};

		void parse();

		return () => {
			isCancelled = true;
		};
	}, [file, onParsed, onLoadingChange]);

	return null;
}
