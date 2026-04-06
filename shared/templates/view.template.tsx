/* @jsxRuntime automatic */
/* @jsxImportSource hono/jsx */

import { raw } from "hono/html";
import { getThemeDefinition, getThemePaths } from "../themes/theme-registry";

const defaultDescription =
	"Convert and share your markdown files as beautiful HTML pages";

function escapeHtmlAttribute(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

function renderAlternateLinks(
	alternateLinks?: Array<{
		hreflang: string;
		href: string;
	}>,
) {
	if (!alternateLinks?.length) {
		return null;
	}

	return raw(
		alternateLinks
			.map(
				(link) =>
					`<link rel="alternate" hreflang="${escapeHtmlAttribute(link.hreflang)}" href="${escapeHtmlAttribute(link.href)}" />`,
			)
			.join(""),
	);
}

const themeToggleScript = `
	try {
		const html = document.documentElement;
		const storedTheme = localStorage.getItem("theme");
		if (storedTheme) {
			html.setAttribute("data-theme", storedTheme);
		}
		const toggleBtn = document.getElementById("theme-toggle");
		if (toggleBtn) {
			toggleBtn.addEventListener("click", () => {
				const currentTheme = html.getAttribute("data-theme");
				const systemDark = window.matchMedia(
					"(prefers-color-scheme: dark)",
				).matches;
				const isDark = currentTheme === "dark" || (!currentTheme && systemDark);
				const newTheme = isDark ? "light" : "dark";
				html.setAttribute("data-theme", newTheme);
				localStorage.setItem("theme", newTheme);
			});
		}
	} catch (e) {
		console.error("Theme toggle failed", e);
	}
`;

const exportActionsScript = `
	try {
		const exportBtn = document.getElementById("export-btn");
		const dropdown = document.getElementById("export-dropdown");
		const copyOption = document.getElementById("copy-markdown-option");
		const pdfOption = document.getElementById("export-pdf-option");

		if (!exportBtn || !dropdown) return;

		const markdown = exportBtn.dataset.markdown || "";
		let copyTimeout = null;

		exportBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			dropdown.classList.toggle("show");
		});

		document.addEventListener("click", () => {
			dropdown.classList.remove("show");
		});

		if (copyOption) {
			copyOption.addEventListener("click", async (e) => {
				e.stopPropagation();
				try {
					let copied = false;

					if (navigator.clipboard?.writeText) {
						try {
							await navigator.clipboard.writeText(markdown);
							copied = true;
						} catch {}
					}

					if (copied) {
						copyOption.classList.add("copied");
						if (copyTimeout) {
							clearTimeout(copyTimeout);
						}
						copyTimeout = setTimeout(() => {
							copyOption.classList.remove("copied");
						}, 1500);
					} else {
						throw new Error("Copy command failed");
					}
				} catch (e) {
					console.error("Failed to copy markdown", e);
					alert("Failed to copy markdown to clipboard");
				}
			});
		}

		if (pdfOption) {
			pdfOption.addEventListener("click", (e) => {
				e.stopPropagation();
				dropdown.classList.remove("show");
				window.print();
			});
		}
	} catch (e) {
		console.error("Export actions initialization failed", e);
	}
`;

const fontSizeControlsScript = `
	try {
		const content = document.querySelector(".content");
		const decreaseBtn = document.getElementById("font-size-decrease");
		const increaseBtn = document.getElementById("font-size-increase");

		if (!content || !decreaseBtn || !increaseBtn) return;

		const sizes = [
			"10px",
			"12px",
			"14px",
			"15px",
			"16px",
			"17px",
			"18px",
			"19px",
			"20px",
		];
		const computedFontSize = Number.parseFloat(
			window.getComputedStyle(content).fontSize,
		);
		const resolvedIndex = Number.isFinite(computedFontSize)
			? sizes.reduce((closestIndex, size, index) => {
					const closestDistance = Math.abs(
						Number.parseFloat(sizes[closestIndex]) - computedFontSize,
					);
					const currentDistance = Math.abs(
						Number.parseFloat(size) - computedFontSize,
					);
					return currentDistance < closestDistance ? index : closestIndex;
				}, 0)
			: 4;
		let currentIndex = resolvedIndex;
		let hasUserSetFontSize = false;

		function syncControls() {
			decreaseBtn.disabled = currentIndex === 0;
			increaseBtn.disabled = currentIndex === sizes.length - 1;
			if (hasUserSetFontSize) {
				content.style.fontSize = sizes[currentIndex];
			}
		}

		function setFontSize(index) {
			if (index < 0 || index >= sizes.length || index === currentIndex) return;
			currentIndex = index;
			hasUserSetFontSize = true;
			syncControls();
		}

		decreaseBtn.addEventListener("click", () => {
			setFontSize(currentIndex - 1);
		});

		increaseBtn.addEventListener("click", () => {
			setFontSize(currentIndex + 1);
		});

		syncControls();
	} catch (e) {
		console.error("Font size control failed", e);
	}
`;

interface ThemeToggleButtonProps {
	show: boolean;
}

const ThemeToggleButton = ({ show }: ThemeToggleButtonProps) => {
	if (!show) return null;

	return (
		<button
			type="button"
			class="theme-toggle"
			id="theme-toggle"
			aria-label="Toggle theme"
		>
			<svg
				class="icon-sun"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
				/>
			</svg>
			<svg
				class="icon-moon"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
				/>
			</svg>
		</button>
	);
};

interface ExportButtonProps {
	markdown?: string;
}

const ExportButton = ({ markdown }: ExportButtonProps) => {
	if (!markdown) return null;

	return (
		<div class="export-container">
			<button
				type="button"
				class="export-btn"
				id="export-btn"
				aria-label="Export"
				data-markdown={markdown}
			>
				<svg
					class="icon-export"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
					/>
				</svg>
			</button>
			<div class="export-dropdown" id="export-dropdown">
				<button type="button" class="export-option" id="copy-markdown-option">
					<svg
						class="option-icon"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
						/>
					</svg>
					<svg
						class="option-check"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					<span>Copy Markdown</span>
				</button>
				<button type="button" class="export-option" id="export-pdf-option">
					<svg
						class="option-icon"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					<span>Export to PDF</span>
				</button>
			</div>
		</div>
	);
};

const FontSizeControls = () => {
	return (
		<fieldset class="font-size-controls" aria-label="Font size controls">
			<button
				type="button"
				class="font-size-btn"
				id="font-size-decrease"
				aria-label="Decrease font size"
			>
				<svg
					class="font-size-icon"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					<circle cx="11" cy="11" r="6" />
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.5 11h5" />
					<path stroke-linecap="round" stroke-linejoin="round" d="m16 16 4 4" />
				</svg>
			</button>
			<button
				type="button"
				class="font-size-btn"
				id="font-size-increase"
				aria-label="Increase font size"
			>
				<svg
					class="font-size-icon"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					<circle cx="11" cy="11" r="6" />
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.5 11h5" />
					<path stroke-linecap="round" stroke-linejoin="round" d="M11 8.5v5" />
					<path stroke-linecap="round" stroke-linejoin="round" d="m16 16 4 4" />
				</svg>
			</button>
		</fieldset>
	);
};

interface MetaTagsProps {
	title: string;
	description: string;
	url?: string;
}

const MetaTags = ({ title, description, url }: MetaTagsProps) => (
	<>
		<meta name="description" content={description} />
		<meta property="og:title" content={title} />
		<meta property="og:description" content={description} />
		<meta property="og:type" content="article" />
		{url && <meta property="og:url" content={url} />}
		<meta name="twitter:card" content="summary" />
		<meta name="twitter:title" content={title} />
		<meta name="twitter:description" content={description} />
	</>
);

interface ScriptsProps {
	hasMermaid?: boolean;
	hasToc?: boolean;
}

const Scripts = ({ hasMermaid, hasToc }: ScriptsProps) => {
	const tocScript = hasToc
		? `
		(function() {
			try {
				const body = document.body;
				const content = document.querySelector(".content");
				const toggleBtn = document.getElementById("toc-toggle");
				const panel = document.getElementById("toc-panel");
				const list = document.getElementById("toc-list");
				const backdrop = document.getElementById("toc-backdrop");

				if (!content || !toggleBtn || !panel || !list || !backdrop) return;

				const headings = Array.from(
					content.querySelectorAll(
						"h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]",
					),
				);

				if (headings.length === 0) {
					toggleBtn.style.display = "none";
					panel.style.display = "none";
					backdrop.style.display = "none";
					return;
				}

				const setExpanded = (expanded) => {
					toggleBtn.setAttribute("aria-expanded", String(expanded));
				};

				const openToc = () => {
					body.classList.add("toc-open");
					setExpanded(true);
				};
				const closeToc = () => {
					body.classList.remove("toc-open");
					setExpanded(false);
				};
				const toggleToc = () => {
					if (body.classList.contains("toc-open")) {
						closeToc();
					} else {
						openToc();
					}
				};

				const fragment = document.createDocumentFragment();

				for (const heading of headings) {
					const level = Number.parseInt(heading.tagName.slice(1), 10);
					const text = heading.textContent?.trim();
					const id = heading.id;
					if (!text || !id) continue;

					const item = document.createElement("li");
					item.className = "toc-item";
					item.setAttribute("data-level", String(level));

					const link = document.createElement("a");
					link.className = "toc-link";
					link.href = \`#\${id}\`;
					link.textContent = text;
					link.addEventListener("click", () => {
						closeToc();
					});

					item.appendChild(link);
					fragment.appendChild(item);
				}

				list.innerHTML = "";
				list.appendChild(fragment);

				toggleBtn.addEventListener("click", (e) => {
					e.stopPropagation();
					toggleToc();
				});

				panel.addEventListener("click", (e) => {
					e.stopPropagation();
				});

				backdrop.addEventListener("click", closeToc);

				document.addEventListener("keydown", (e) => {
					if (e.key === "Escape") {
						closeToc();
					}
				});

				document.addEventListener("click", (e) => {
					if (!(e.target instanceof Node)) return;
					if (body.classList.contains("toc-open") && !panel.contains(e.target)) {
						closeToc();
					}
				});
			} catch (e) {
				console.error("TOC initialization failed", e);
			}
		})();
	`
		: "";

	const mainScript = raw(`
		(function() {
			${themeToggleScript}
		})();
		(function() {
			${exportActionsScript}
		})();
		${tocScript}
		(function() {
			${fontSizeControlsScript}
		})();
	`);

	const mermaidScript = raw(`
		const { default: mermaid } = await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs');
		const html = document.documentElement;

		function getIsDark() {
			const dataTheme = html.getAttribute('data-theme');
			const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			return dataTheme === 'dark' || (!dataTheme && systemDark);
		}

		async function renderMermaid() {
			const containers = document.querySelectorAll('.mermaid[data-source]');
			containers.forEach((el) => {
				el.removeAttribute('data-processed');
				el.textContent = el.getAttribute('data-source') ?? '';
			});
			mermaid.initialize({ startOnLoad: false, theme: getIsDark() ? 'dark' : 'default', gannt: { useMaxWidth: false } });
			await mermaid.run();
		}

		const mermaidBlocks = document.querySelectorAll('pre > code.language-mermaid');

		mermaidBlocks.forEach((el) => {
			const pre = el.parentElement;
			const container = document.createElement('div');
			container.className = 'mermaid';
			container.setAttribute('data-source', el.textContent);
			container.textContent = el.textContent;
			pre.parentNode.replaceChild(container, pre);
		});
		await renderMermaid();

		new MutationObserver(() => renderMermaid()).observe(html, { attributes: true, attributeFilter: ['data-theme'] });
	`);

	return (
		<>
			<script>{mainScript}</script>
			{hasMermaid && <script type="module">{mermaidScript}</script>}
		</>
	);
};

interface FooterProps {
	expiresAt?: string;
}

const Footer = ({ expiresAt }: FooterProps) => {
	const poweredBy = (
		<footer>
			<p>
				Powered by <a href="https://mdto.page">mdto.page</a>
			</p>
		</footer>
	);

	if (!expiresAt) return poweredBy;

	const dateMs = Number.parseInt(expiresAt, 10);
	if (!Number.isFinite(dateMs)) {
		return poweredBy;
	}

	const formattedDate = new Date(dateMs).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

	return (
		<footer>
			<p>
				Expires on {formattedDate} | <a href="https://mdto.page">mdto.page</a>
			</p>
		</footer>
	);
};

interface CreateHtmlPageOptions {
	lang?: string;
	title: string;
	description?: string;
	html: string;
	expiresAt?: string;
	markdown?: string;
	theme?: string;
	hasKatex?: boolean;
	hasMermaid?: boolean;
	canonicalUrl?: string;
	alternateLinks?: Array<{
		hreflang: string;
		href: string;
	}>;
}

export function ViewTemplate(options: CreateHtmlPageOptions) {
	const {
		lang,
		title,
		description,
		html: htmlContent,
		expiresAt,
		markdown,
		theme = "default",
		hasKatex,
		hasMermaid,
		canonicalUrl,
		alternateLinks,
	} = options;
	const themeDefinition = getThemeDefinition(theme);
	const { themePath, hljsThemePath } = getThemePaths(theme);
	const metaDescription = description || defaultDescription;

	return (
		<html lang={lang || "en"}>
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>{title}</title>
				<MetaTags
					title={title}
					description={metaDescription}
					url={canonicalUrl}
				/>
				{canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
				{renderAlternateLinks(alternateLinks)}
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossorigin="anonymous"
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
					rel="stylesheet"
				/>
				<link rel="stylesheet" href={themePath} />
				<link rel="stylesheet" href={hljsThemePath} />
				{hasKatex && (
					<link
						rel="stylesheet"
						href="https://cdn.jsdelivr.net/npm/katex@0.16.27/dist/katex.min.css"
						integrity="sha384-Pu5+C18nP5dwykLJOhd2U4Xen7rjScHN/qusop27hdd2drI+lL5KvX7YntvT8yew"
						crossorigin="anonymous"
					/>
				)}
			</head>
			<body class={`theme-${themeDefinition.id}`}>
				<div class="top-actions">
					<FontSizeControls />
					<ExportButton markdown={markdown} />
					<ThemeToggleButton
						show={themeDefinition.features.showColorModeToggle}
					/>
				</div>
				{themeDefinition.features.showToc && (
					<>
						<button
							type="button"
							class="toc-toggle"
							id="toc-toggle"
							aria-label="Toggle table of contents"
							aria-controls="toc-panel"
							aria-expanded="false"
						>
							<svg
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M4 6h16M4 12h16M4 18h10"
								/>
							</svg>
						</button>
						<div class="toc-backdrop" id="toc-backdrop" />
						<aside
							class="toc-panel"
							id="toc-panel"
							aria-label="Table of contents"
						>
							<div class="toc-header">On this page</div>
							<ul class="toc-list" id="toc-list" />
						</aside>
					</>
				)}
				<div class="content">{raw(htmlContent)}</div>
				<Footer expiresAt={expiresAt} />
				<Scripts
					hasMermaid={hasMermaid}
					hasToc={themeDefinition.features.showToc}
				/>
			</body>
		</html>
	);
}
