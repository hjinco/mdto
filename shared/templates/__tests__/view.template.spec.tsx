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
		const html = `<!DOCTYPE html>${<ViewTemplate title="Test" html="<p>content</p>" theme="github" />}`;

		expect(html).toContain('<link rel="stylesheet" href="/themes/github.css"');
		expect(html).toContain(
			'<link rel="stylesheet" href="/themes/github.hljs.css"',
		);
	});

	it("only renders toc and theme toggle for themes that enable them", () => {
		const defaultHtml = `<!DOCTYPE html>${<ViewTemplate title="Default" html="<h1>Heading</h1>" theme="default" />}`;
		const githubHtml = `<!DOCTYPE html>${<ViewTemplate title="GitHub" html="<h1>Heading</h1>" theme="github" />}`;
		const resumeHtml = `<!DOCTYPE html>${<ViewTemplate title="Resume" html="<h1>Heading</h1>" theme="resume" />}`;

		expect(defaultHtml).toContain('id="font-size-decrease"');
		expect(defaultHtml).toContain('id="font-size-increase"');
		expect(githubHtml).toContain('id="font-size-decrease"');
		expect(resumeHtml).toContain('id="font-size-increase"');
		expect(defaultHtml).toContain("decreaseBtn.disabled = currentIndex === 0;");
		expect(defaultHtml).toContain(
			"increaseBtn.disabled = currentIndex === sizes.length - 1;",
		);
		expect(defaultHtml).toContain("window.getComputedStyle(content).fontSize");
		expect(defaultHtml).toContain("let currentIndex = resolvedIndex;");
		expect(defaultHtml).toContain("let hasUserSetFontSize = false;");
		expect(defaultHtml).toContain("if (hasUserSetFontSize) {");
		expect(defaultHtml).not.toContain('(e.metaKey || e.ctrlKey)');
		expect(defaultHtml).not.toContain(
			"content.style.fontSize = sizes[currentIndex];\n\t\t\tdecreaseBtn.disabled",
		);
		expect(defaultHtml).toContain('class="font-size-icon"');
		expect(defaultHtml).toContain('d="m16 16 4 4"');
		expect(defaultHtml).toContain('id="theme-toggle"');
		expect(defaultHtml).toContain('id="toc-toggle"');
		expect(githubHtml).toContain('id="theme-toggle"');
		expect(githubHtml).not.toContain('id="toc-toggle"');
		expect(resumeHtml).not.toContain('id="theme-toggle"');
		expect(resumeHtml).not.toContain('id="toc-toggle"');
	});
});
