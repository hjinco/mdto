import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateTemplateHashes } from "./generate-template-hash";

let themeCssByName: Record<string, string> = {
	default: "body{color:red}",
	dark: "body{color:white;background:black}",
};

vi.mock("node:fs", () => {
	return {
		existsSync: vi.fn(() => false),
		readdirSync: vi.fn(() => [
			"default.css",
			"dark.css",
			"default.hljs.css",
			"dark.hljs.css",
		]),
		readFileSync: vi.fn((filePath: string) => {
			if (filePath.endsWith("shared/templates/view.template.tsx")) {
				return "<main>template</main>";
			}
			for (const [themeName, css] of Object.entries(themeCssByName)) {
				if (filePath.endsWith(`public/themes/${themeName}.css`)) {
					return css;
				}
			}
			return "";
		}),
		writeFileSync: vi.fn(),
	};
});

describe("generateTemplateHashes - theme changes", () => {
	beforeEach(() => {
		themeCssByName = {
			default: "body{color:red}",
			dark: "body{color:white;background:black}",
		};
	});

	it("changes the theme hash when the theme CSS content changes", () => {
		const hashesBefore = generateTemplateHashes("/mock-root");

		themeCssByName.default = "body{color:blue}";
		const hashesAfter = generateTemplateHashes("/mock-root");

		expect(hashesBefore.default).toBeDefined();
		expect(hashesAfter.default).toBeDefined();
		expect(hashesBefore.default).not.toBe(hashesAfter.default);
	});

	it("does not change other theme hashes when only one theme changes", () => {
		const hashesBefore = generateTemplateHashes("/mock-root");

		themeCssByName.dark = "body{color:yellow;background:black}";
		const hashesAfter = generateTemplateHashes("/mock-root");

		expect(hashesBefore.dark).not.toBe(hashesAfter.dark);
		expect(hashesBefore.default).toBe(hashesAfter.default);
	});
});
