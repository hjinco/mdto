import { isLocalImagePath } from "@shared/markdown";
import { ViewTemplate } from "@shared/templates/view.template";
import {
	getThemeDefinition,
	type ThemeId,
} from "@shared/themes/theme-registry";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ParsedMarkdown } from "../components/MarkdownParser";

interface UsePreviewProps {
	parsed: ParsedMarkdown | null;
	theme: ThemeId;
	expirationDays: number;
}

const LOCAL_IMAGE_PREVIEW_PLACEHOLDER =
	"data:image/svg+xml;charset=utf-8," +
	encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="Local image preview placeholder">
  <defs>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#d8dee4" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="960" height="540" rx="18" fill="#f6f8fa"/>
  <rect width="960" height="540" rx="18" fill="url(#grid)" opacity="0.45"/>
  <g fill="none" stroke="#6e7781" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
    <rect x="350" y="150" width="260" height="190" rx="22"/>
    <circle cx="430" cy="220" r="28"/>
    <path d="M375 315l80-80 60 60 35-35 60 55"/>
  </g>
  <text x="480" y="395" text-anchor="middle" font-family="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="28" font-weight="600" fill="#24292f">Local image preview</text>
  <text x="480" y="432" text-anchor="middle" font-family="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="18" fill="#57606a">Attach the image when publishing</text>
</svg>
`);

function applyLocalImagePlaceholders(iframeDoc: Document) {
	for (const image of iframeDoc.querySelectorAll("img")) {
		const src = image.getAttribute("src");
		if (!src || !isLocalImagePath(src)) continue;

		image.dataset.previewOriginalSrc = src;
		image.src = LOCAL_IMAGE_PREVIEW_PLACEHOLDER;
		image.loading = "lazy";
		image.decoding = "async";
		if (!image.alt) {
			image.alt = src;
		}
	}
}

export function usePreview({ parsed, theme, expirationDays }: UsePreviewProps) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const iframeRef = useRef<HTMLIFrameElement>(null);

	const themeName = useMemo(() => getThemeDefinition(theme).label, [theme]);

	useEffect(() => {
		let isCancelled = false;
		const iframe = iframeRef.current;

		const handleLoad = () => {
			if (!isCancelled) {
				const iframeDoc =
					iframe?.contentDocument || iframe?.contentWindow?.document;
				if (iframeDoc) {
					applyLocalImagePlaceholders(iframeDoc);
				}
				setLoading(false);
			}
		};

		const renderPreview = async () => {
			if (!parsed) {
				setLoading(true);
				return;
			}

			try {
				setLoading(true);
				setError(null);

				await new Promise((resolve) => setTimeout(resolve, 100));

				const { markdown, html, metadata } = parsed;
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
					applyLocalImagePlaceholders(iframeDoc);
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
	}, [parsed, theme, themeName, expirationDays]);

	return {
		loading,
		error,
		iframeRef,
		themeName,
	};
}
