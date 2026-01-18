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
 * Create HTML page for viewing markdown content
 * @param title - Page title
 * @param htmlContent - The converted HTML content from markdown
 * @param theme - The theme name to use (default: 'default')
 * @returns Complete HTML page as string
 */
export function createHtmlPage(
	title: string,
	htmlContent: string,
	theme: string = "default",
): string {
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

	const isDefaultTheme = theme === "default" || !theme;
	const toggleButtonHtml = isDefaultTheme
		? `
	<button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
		<svg class="icon-sun" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
		</svg>
		<svg class="icon-moon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
		</svg>
	</button>
	<script>
		(function() {
			try {
				const html = document.documentElement;
				const storedTheme = localStorage.getItem('theme');
				if (storedTheme) {
					html.setAttribute('data-theme', storedTheme);
				}
				const toggleBtn = document.getElementById('theme-toggle');
				if (toggleBtn) {
					toggleBtn.addEventListener('click', () => {
						const currentTheme = html.getAttribute('data-theme');
						const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
						const isDark = currentTheme === 'dark' || (!currentTheme && systemDark);
						const newTheme = isDark ? 'light' : 'dark';
						html.setAttribute('data-theme', newTheme);
						localStorage.setItem('theme', newTheme);
					});
				}
			} catch (e) {
				console.error('Theme toggle failed', e);
			}
		})();
	</script>`
		: "";

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
	${toggleButtonHtml}
	<div class="content">
		${htmlContent}
	</div>
	<footer>
		<p>Powered by <a href="https://mdto.page">mdto.page</a></p>
	</footer>
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
