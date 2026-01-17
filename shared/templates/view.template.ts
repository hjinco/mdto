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
