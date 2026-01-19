import { createHtmlPage } from "@shared/templates/view.template";
import { markdownToHtml } from "@shared/utils/markdown";
import { useEffect, useMemo, useRef, useState } from "react";

interface UsePreviewProps {
	file: File;
	theme: string;
	expirationDays: number;
}

export function usePreview({ file, theme, expirationDays }: UsePreviewProps) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const iframeRef = useRef<HTMLIFrameElement>(null);

	const themeName = useMemo(
		() => theme.charAt(0).toUpperCase() + theme.slice(1),
		[theme],
	);

	useEffect(() => {
		const renderPreview = async () => {
			try {
				setLoading(true);
				const markdown = await file.text();

				const html = await markdownToHtml(markdown);
				const expirationTime =
					Date.now() + expirationDays * 24 * 60 * 60 * 1000;
				const previewHtml = createHtmlPage({
					title: `Preview - ${themeName}`,
					expiresAt: expirationTime.toString(),
					html,
					theme,
					markdown,
				});

				const iframe = iframeRef.current;
				if (iframe) {
					const iframeDoc =
						iframe.contentDocument || iframe.contentWindow?.document;
					if (iframeDoc) {
						iframeDoc.open();
						iframeDoc.write(previewHtml);
						iframeDoc.close();
					}
				}

				setLoading(false);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
				setLoading(false);
			}
		};

		renderPreview();
	}, [file, theme, themeName, expirationDays]);

	return {
		loading,
		error,
		iframeRef,
		themeName,
	};
}
