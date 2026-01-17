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
	return `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${title}</title>
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
