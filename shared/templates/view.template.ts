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

const metaDescription =
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
 * Initialize copy button functionality
 * This function will be stringified and inserted into the HTML template
 */
function initCopyButton(): void {
	try {
		const copyBtn = document.getElementById("copy-markdown");
		if (copyBtn) {
			const markdown = copyBtn.dataset.markdown || "";
			let copyTimeout: ReturnType<typeof setTimeout> | null = null;

			// Fallback copy function using document.execCommand
			function fallbackCopyText(text: string): boolean {
				const textarea = document.createElement("textarea");
				textarea.value = text;
				textarea.style.position = "fixed";
				textarea.style.left = "-999999px";
				textarea.style.top = "-999999px";
				document.body.appendChild(textarea);
				textarea.focus();
				textarea.select();

				try {
					const successful = document.execCommand("copy");
					document.body.removeChild(textarea);
					return successful;
				} catch {
					document.body.removeChild(textarea);
					return false;
				}
			}

			copyBtn.addEventListener("click", async () => {
				try {
					let copied = false;

					// Try modern clipboard API first
					if (navigator.clipboard?.writeText) {
						try {
							await navigator.clipboard.writeText(markdown);
							copied = true;
						} catch {
							// Fallback to execCommand if clipboard API fails
							copied = fallbackCopyText(markdown);
						}
					} else {
						// Use fallback if clipboard API is not available
						copied = fallbackCopyText(markdown);
					}

					if (copied) {
						copyBtn.classList.add("copied");
						if (copyTimeout) {
							clearTimeout(copyTimeout);
						}
						copyTimeout = setTimeout(() => {
							copyBtn.classList.remove("copied");
						}, 2000) as ReturnType<typeof setTimeout>;
					} else {
						throw new Error("Copy command failed");
					}
				} catch (e) {
					console.error("Failed to copy markdown", e);
					alert("Failed to copy markdown to clipboard");
				}
			});
		}
	} catch (e) {
		console.error("Copy button initialization failed", e);
	}
}

interface CreateHtmlPageOptions {
	title: string;
	html: string;
	expiresAt: string;
	markdown?: string;
	theme?: string;
}

export function createHtmlPage(options: CreateHtmlPageOptions): string {
	const {
		title,
		html: htmlContent,
		expiresAt,
		markdown,
		theme = "default",
	} = options;
	const { themePath, hljsThemePath } = getThemePaths(theme);

	const metaTags = [
		`<meta name="description" content="${escapeHtml(metaDescription)}">`,
		`<meta property="og:title" content="${escapeHtml(title)}">`,
		`<meta property="og:description" content="${escapeHtml(metaDescription)}">`,
		`<meta property="og:type" content="article">`,
		`<meta name="twitter:card" content="summary">`,
		`<meta name="twitter:title" content="${escapeHtml(title)}">`,
		`<meta name="twitter:description" content="${escapeHtml(metaDescription)}">`,
	];

	const toggleButtonHtml =
		theme !== "resume"
			? `
	<button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
		<svg class="icon-sun" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
		</svg>
		<svg class="icon-moon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
		</svg>
	</button>`
			: "";

	// Copy button HTML (only shown if markdown is available)
	const copyButtonHtml = markdown
		? `
	<button class="copy-markdown" id="copy-markdown" aria-label="Copy markdown" data-markdown="${escapeHtml(markdown)}">
		<svg class="icon-copy" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
		</svg>
		<svg class="icon-check" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
		</svg>
	</button>`
		: "";

	// JavaScript for theme toggle and copy functionality
	// Extract function bodies and wrap them in IIFEs
	const themeToggleBody = getFunctionBody(initThemeToggle);
	const copyButtonBody = getFunctionBody(initCopyButton);
	const scriptsHtml = `
	<script>
		(function() {
			${themeToggleBody}
		})();
		(function() {
			${copyButtonBody}
		})();
	</script>`;

	let footerHtml = "";
	try {
		const date = new Date(parseInt(expiresAt, 10));
		const formattedDate = date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
		footerHtml = `Expires on ${formattedDate} | <a href="https://mdto.page">mdto.page</a>`;
	} catch (e) {
		console.error("Failed to parse expiration date", e);
	}

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapeHtml(title)}</title>
	${metaTags.join("\n\t")}
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
	<link rel="stylesheet" href="${themePath}">
	<link rel="stylesheet" href="${hljsThemePath}">
</head>
<body>
	<div class="top-actions">
		${copyButtonHtml}
		${toggleButtonHtml}
	</div>
	<div class="content">
		${htmlContent}
	</div>
	<footer>
		<p>${footerHtml}</p>
	</footer>
	${scriptsHtml}
</body>
</html>`;
}

/**
 * Escape HTML special characters to prevent XSS
 * @param text - Text to escape
 * @returns Escaped text
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}
