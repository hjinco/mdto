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
});
