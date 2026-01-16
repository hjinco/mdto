/**
 * Create HTML page for viewing markdown content
 * @param slug - The slug identifier for the page title
 * @param htmlContent - The converted HTML content from markdown
 * @returns Complete HTML page as string
 */
export function createViewHtml(slug: string, htmlContent: string): string {
	return `<!DOCTYPE html>
<html lang="ko">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${slug}</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
	<style>
		:root {
			--bg-root: #0B0C0E;
			--bg-card: #141518;
			--border-subtle: #26272D;
			--text-primary: #EDEDED;
			--text-secondary: #8A8F98;
			--primary-color: #5E6AD2;
			--code-bg: #1A1B1F;
			--code-border: #26272D;
		}

		body {
			font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			line-height: 1.6;
			max-width: 720px;
			margin: 0 auto;
			padding: 48px 24px;
			background-color: var(--bg-root);
			color: var(--text-primary);
			-webkit-font-smoothing: antialiased;
		}

		.content {
			/* No container visible, just content */
		}

		/* Typography */
		h1, h2, h3, h4, h5, h6 {
			color: var(--text-primary);
			margin-top: 2.5em;
			margin-bottom: 0.75em;
			line-height: 1.2;
			letter-spacing: -0.02em;
			font-weight: 600;
		}

		h1:first-child { margin-top: 0; }

		h1 { font-size: 2em; letter-spacing: -0.03em; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5em; }
		h2 { font-size: 1.5em; }
		h3 { font-size: 1.25em; }
		h4 { font-size: 1.1em; }

		p {
			margin-bottom: 1.5em;
			color: #D4D4D4; /* Slightly softer than pure white */
		}

		/* Code */
		code {
			background-color: rgba(255,255,255,0.1);
			padding: 2px 5px;
			border-radius: 4px;
			font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
			font-size: 0.9em;
			color: #E6E6E6;
		}

		pre {
			background-color: var(--code-bg);
			border: 1px solid var(--code-border);
			padding: 16px;
			border-radius: 8px;
			overflow-x: auto;
			margin-bottom: 1.5em;
		}

		pre code {
			background-color: transparent;
			padding: 0;
			color: inherit;
			font-size: 0.85em;
		}

		/* Lists */
		ul, ol {
			margin-bottom: 1.5em;
			padding-left: 1.5em;
			color: #D4D4D4;
		}

		li {
			margin-bottom: 0.5em;
		}

		/* Links */
		a {
			color: var(--primary-color);
			text-decoration: none;
			border-bottom: 1px solid transparent;
			transition: border-color 0.2s;
		}

		a:hover {
			border-color: var(--primary-color);
		}

		/* Blockquotes */
		blockquote {
			border-left: 3px solid var(--primary-color);
			margin: 0 0 1.5em 0;
			padding-left: 1.2em;
			color: var(--text-secondary);
			font-style: italic;
		}

		/* Tables */
		table {
			width: 100%;
			border-collapse: collapse;
			margin-bottom: 1.5em;
			font-size: 0.95em;
		}

		th, td {
			padding: 10px;
			border-bottom: 1px solid var(--border-subtle);
			text-align: left;
		}

		th {
			color: var(--text-primary);
			font-weight: 600;
		}

		td {
			color: var(--text-secondary);
		}

		img {
			max-width: 100%;
			border-radius: 8px;
			margin-bottom: 1.5em;
		}
		
		hr {
			border: none;
			border-top: 1px solid var(--border-subtle);
			margin: 3em 0;
		}
		
		/* Checkboxes for task lists */
		input[type="checkbox"] {
			margin-right: 0.5em;
			accent-color: var(--primary-color);
		}

		/* Footer */
		footer {
			margin-top: 4rem;
			padding-top: 2rem;
			text-align: center;
			font-size: 0.875rem;
			color: var(--text-secondary);
		}

		footer a {
			color: var(--text-secondary);
			text-decoration: none;
			transition: color 0.2s;
		}

		footer a:hover {
			color: var(--text-primary);
		}
	</style>
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
