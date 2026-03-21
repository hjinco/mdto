import { describe, expect, it } from "vitest";
import {
	getThemeDefinition,
	getThemePaths,
	OVERFLOW_THEME_OPTIONS,
	PRIMARY_THEME_OPTIONS,
	resolveThemeId,
	THEME_OPTIONS,
} from "./theme-registry";

describe("theme registry", () => {
	it("falls back to default for unknown theme ids", () => {
		expect(resolveThemeId("unknown")).toBe("default");
		expect(getThemeDefinition("unknown").id).toBe("default");
		expect(getThemePaths("unknown")).toEqual({
			themePath: "/themes/default.css",
			hljsThemePath: "/themes/default.hljs.css",
		});
	});

	it("exposes current theme options in one place", () => {
		expect(THEME_OPTIONS).toEqual([
			{ value: "default", label: "Default" },
			{ value: "resume", label: "Resume" },
			{ value: "github", label: "GitHub" },
			{ value: "matrix", label: "Matrix" },
		]);
	});

	it("splits theme options for the primary picker and overflow popover", () => {
		expect(PRIMARY_THEME_OPTIONS).toEqual([
			{ value: "default", label: "Default" },
			{ value: "resume", label: "Resume" },
			{ value: "github", label: "GitHub" },
		]);
		expect(OVERFLOW_THEME_OPTIONS).toEqual([
			{ value: "matrix", label: "Matrix" },
		]);
	});

	it("tracks theme-specific feature flags", () => {
		expect(getThemeDefinition("default").features).toEqual({
			showToc: true,
			showColorModeToggle: true,
		});
		expect(getThemeDefinition("github").features).toEqual({
			showToc: false,
			showColorModeToggle: true,
		});
		expect(getThemeDefinition("resume").features).toEqual({
			showToc: false,
			showColorModeToggle: false,
		});
	});
});
