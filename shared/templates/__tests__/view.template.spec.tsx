/* @jsxRuntime automatic */
/* @jsxImportSource hono/jsx */
import { describe, expect, it } from "vitest";
import { ViewTemplate } from "../view.template";

describe("ViewTemplate mermaid rendering", () => {
	it("re-injects mermaid source as text instead of HTML", () => {
		const html = `<!DOCTYPE html>${(
			<ViewTemplate
				title="Test"
				html="<pre><code class='language-mermaid'>graph TD;A--&gt;B;</code></pre>"
				theme="default"
				hasMermaid
			/>
		)}`;

		expect(html).toContain(
			"el.textContent = el.getAttribute('data-source') ?? '';",
		);
		expect(html).not.toContain(
			"el.innerHTML = el.getAttribute('data-source');",
		);
	});

	it("renders the generated theme and hljs assets for the selected theme", () => {
		const html = `<!DOCTYPE html>${<ViewTemplate title="Test" html="<p>content</p>" theme="matrix" />}`;

		expect(html).toContain('<link rel="stylesheet" href="/themes/matrix.css"');
		expect(html).toContain(
			'<link rel="stylesheet" href="/themes/matrix.hljs.css"',
		);
	});

	it("only renders toc and theme toggle for themes that enable them", () => {
		const defaultHtml = `<!DOCTYPE html>${<ViewTemplate title="Default" html="<h1>Heading</h1>" theme="default" />}`;
		const resumeHtml = `<!DOCTYPE html>${<ViewTemplate title="Resume" html="<h1>Heading</h1>" theme="resume" />}`;

		expect(defaultHtml).toContain('id="theme-toggle"');
		expect(defaultHtml).toContain('id="toc-toggle"');
		expect(resumeHtml).not.toContain('id="theme-toggle"');
		expect(resumeHtml).not.toContain('id="toc-toggle"');
	});
});
