import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateTemplateHashes } from "./generate-template-hash";

let themeCssByName: Record<string, string> = {
	default: "body{color:red}",
	dark: "body{color:white;background:black}",
};

let themeHljsCssByName: Record<string, string> = {
	default: ".hljs{color:red}",
	dark: ".hljs{color:white;background:black}",
};

function getThemeNameFromThemePath(filePath: string): string | null {
	const match = /public\/themes\/(.+?)(?:\.hljs)?\.css$/.exec(filePath);
	return match?.[1] ?? null;
}

vi.mock("node:fs", () => {
	return {
		existsSync: vi.fn((filePath: string) => {
			if (!filePath.endsWith(".hljs.css")) return false;
			const theme = getThemeNameFromThemePath(filePath);
			if (!theme) return false;
			return theme in themeHljsCssByName;
		}),
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
			if (filePath.endsWith(".hljs.css")) {
				const theme = getThemeNameFromThemePath(filePath);
				if (theme && theme in themeHljsCssByName)
					return themeHljsCssByName[theme];
				return "";
			}
			const theme = getThemeNameFromThemePath(filePath);
			if (theme && theme in themeCssByName) return themeCssByName[theme];
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
		themeHljsCssByName = {
			default: ".hljs{color:red}",
			dark: ".hljs{color:white;background:black}",
		};
	});

	it("changes the theme hash when the theme CSS content changes", () => {
		const hashesBefore = generateTemplateHashes();

		themeCssByName.default = "body{color:blue}";
		const hashesAfter = generateTemplateHashes();

		expect(hashesBefore.default).toBeDefined();
		expect(hashesAfter.default).toBeDefined();
		expect(hashesBefore.default).not.toBe(hashesAfter.default);
	});

	it("does not change other theme hashes when only one theme changes", () => {
		const hashesBefore = generateTemplateHashes();

		themeCssByName.dark = "body{color:yellow;background:black}";
		const hashesAfter = generateTemplateHashes();

		expect(hashesBefore.dark).not.toBe(hashesAfter.dark);
		expect(hashesBefore.default).toBe(hashesAfter.default);
	});

	it("changes the theme hash when the theme hljs CSS content changes", () => {
		const hashesBefore = generateTemplateHashes();

		themeHljsCssByName.default = ".hljs{color:blue}";
		const hashesAfter = generateTemplateHashes();

		expect(hashesBefore.default).toBeDefined();
		expect(hashesAfter.default).toBeDefined();
		expect(hashesBefore.default).not.toBe(hashesAfter.default);
	});

	it("does not change other theme hashes when only one theme hljs CSS changes", () => {
		const hashesBefore = generateTemplateHashes();

		themeHljsCssByName.dark = ".hljs{color:yellow;background:black}";
		const hashesAfter = generateTemplateHashes();

		expect(hashesBefore.dark).not.toBe(hashesAfter.dark);
		expect(hashesBefore.default).toBe(hashesAfter.default);
	});
});
