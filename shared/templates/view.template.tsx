/* @jsxRuntime automatic */
/* @jsxImportSource hono/jsx */
import { raw } from "hono/html";

/**
 * Get theme CSS paths with fallback to default theme
 * @param theme - Theme name
 * @returns Object with themePath and hljsThemePath
 */
function getThemePaths(theme: string): {
	themePath: string;
	hljsThemePath: string;
} {
	const normalizedTheme = theme || "default";
	return {
		themePath: `/themes/${normalizedTheme}.css`,
		hljsThemePath: `/themes/${normalizedTheme}.hljs.css`,
	};
}

const defaultDescription =
	"Convert and share your markdown files as beautiful HTML pages";

/**
 * Extract function body from a function, removing the function declaration
 * @param fn - Function to extract body from
 * @returns Function body as string
 */
function getFunctionBody(fn: () => void): string {
	const fnStr = fn.toString();
	// Extract function body (content between first { and last })
	const match = fnStr.match(/\{([\s\S]*)\}/);
	return match ? match[1].trim() : fnStr;
}

/**
 * Initialize theme toggle functionality
 * This function will be stringified and inserted into the HTML template
 */
function initThemeToggle(): void {
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
}

/**
 * Initialize export actions (dropdown with copy and PDF export)
 * This function will be stringified and inserted into the HTML template
 */
function initExportActions(): void {
	try {
		const exportBtn = document.getElementById("export-btn");
		const dropdown = document.getElementById("export-dropdown");
		const copyOption = document.getElementById("copy-markdown-option");
		const pdfOption = document.getElementById("export-pdf-option");

		if (!exportBtn || !dropdown) return;

		const markdown = exportBtn.dataset.markdown || "";
		let copyTimeout: ReturnType<typeof setTimeout> | null = null;

		// Toggle dropdown
		exportBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			dropdown.classList.toggle("show");
		});

		// Close dropdown when clicking outside
		document.addEventListener("click", () => {
			dropdown.classList.remove("show");
		});

		// Copy markdown option
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

		// Export to PDF option
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
}

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

interface MetaTagsProps {
	title: string;
	description: string;
}

const MetaTags = ({ title, description }: MetaTagsProps) => (
	<>
		<meta name="description" content={description} />
		<meta property="og:title" content={title} />
		<meta property="og:description" content={description} />
		<meta property="og:type" content="article" />
		<meta name="twitter:card" content="summary" />
		<meta name="twitter:title" content={title} />
		<meta name="twitter:description" content={description} />
	</>
);

interface ScriptsProps {
	hasMermaid?: boolean;
}

const Scripts = ({ hasMermaid }: ScriptsProps) => {
	const themeToggleBody = getFunctionBody(initThemeToggle);
	const exportActionsBody = getFunctionBody(initExportActions);

	const mainScript = raw(`
		(function() {
			${themeToggleBody}
		})();
		(function() {
			${exportActionsBody}
		})();
		(function() {
			try {
				const content = document.querySelector(".content");
				if (!content) return;

				const SIZES = ["10px", "12px", "14px", "15px", "16px", "17px", "18px", "19px", "20px"];
				const DEFAULT_INDEX = 4;
				let currentIndex = DEFAULT_INDEX;

				function setFontSize(index) {
					if (index >= 0 && index < SIZES.length) {
						currentIndex = index;
						content.style.fontSize = SIZES[currentIndex];
					}
				}

				document.addEventListener("keydown", function(e) {
					if ((e.metaKey || e.ctrlKey) && (e.key === "=" || e.key === "+" || e.key === "-")) {
						e.preventDefault();
						if (e.key === "=" || e.key === "+") {
							setFontSize(currentIndex + 1);
						} else {
							setFontSize(currentIndex - 1);
						}
					}
				});
			} catch (e) {
				console.error("Font size control failed", e);
			}
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
				el.innerHTML = el.getAttribute('data-source');
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
				Powered by <a href="https://mdit.page">mdit.page</a>
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
	} = options;
	const { themePath, hljsThemePath } = getThemePaths(theme);
	const metaDescription = description || defaultDescription;

	return (
		<html lang={lang || "en"}>
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>{title}</title>
				<MetaTags title={title} description={metaDescription} />
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
			<body>
				<div class="top-actions">
					<ExportButton markdown={markdown} />
					<ThemeToggleButton show={theme !== "resume" && theme !== "matrix"} />
				</div>
				<div class="content">{raw(htmlContent)}</div>
				<Footer expiresAt={expiresAt} />
				<Scripts hasMermaid={hasMermaid} />
			</body>
		</html>
	);
}
