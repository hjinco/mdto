const themes: Record<string, string> = {
	default: "/themes/default.css",
	resume: "/themes/resume.css",
};

/**
 * Create HTML page for viewing markdown content
 * @param slug - The slug identifier for the page title
 * @param htmlContent - The converted HTML content from markdown
 * @param theme - The theme name to use (default: 'default')
 * @returns Complete HTML page as string
 */
export function createViewHtml(
	slug: string,
	htmlContent: string,
	theme: string = "default",
): string {
	const themePath = themes[theme] || themes.default;
	return `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${slug}</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
	<link rel="stylesheet" href="${themePath}">
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
