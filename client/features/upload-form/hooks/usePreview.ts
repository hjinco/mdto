import { ViewTemplate } from "@shared/templates/view.template";
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
		let isCancelled = false;
		const iframe = iframeRef.current;

		const handleLoad = () => {
			if (!isCancelled) {
				setLoading(false);
			}
		};

		const renderPreview = async () => {
			try {
				setLoading(true);
				const markdown = await file.text();
				if (isCancelled) return;

				await new Promise((resolve) => setTimeout(resolve, 100));

				const { html, metadata } = await markdownToHtml(markdown);
				const expirationTime =
					expirationDays === -1
						? null
						: Date.now() + expirationDays * 24 * 60 * 60 * 1000;
				const previewHtml = ViewTemplate({
					lang: metadata.lang,
					title: `Preview - ${themeName}`,
					description: metadata.description,
					expiresAt: expirationTime ? expirationTime.toString() : undefined,
					html,
					theme,
					markdown,
					hasKatex: metadata.hasKatex,
					hasMermaid: metadata.hasMermaid,
				});

				if (!iframe) {
					return setLoading(false);
				}

				const iframeDoc =
					iframe.contentDocument || iframe.contentWindow?.document;
				if (iframeDoc) {
					iframe.addEventListener("load", handleLoad, { once: true });
					iframeDoc.open();
					iframeDoc.write(previewHtml.toString());
					iframeDoc.close();
				} else {
					setLoading(false);
				}
			} catch (err) {
				if (!isCancelled) {
					setError(err instanceof Error ? err.message : "Unknown error");
					setLoading(false);
				}
			}
		};

		renderPreview();

		return () => {
			isCancelled = true;
			if (iframe) {
				iframe.removeEventListener("load", handleLoad);
			}
		};
	}, [file, theme, themeName, expirationDays]);

	return {
		loading,
		error,
		iframeRef,
		themeName,
	};
}
