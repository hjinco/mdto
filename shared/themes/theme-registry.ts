export const THEME_IDS = ["default", "resume", "github", "matrix"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export interface ThemeFeatureFlags {
	showToc: boolean;
	showColorModeToggle: boolean;
}

export interface ThemeDefinition {
	id: ThemeId;
	label: string;
	themeFragments: readonly string[];
	hljsFragments: readonly string[];
	features: ThemeFeatureFlags;
}

const themeIdSet = new Set<string>(THEME_IDS);

export function isThemeId(value: string): value is ThemeId {
	return themeIdSet.has(value);
}

export function resolveThemeId(value?: string | null): ThemeId {
	if (value && isThemeId(value)) {
		return value;
	}
	return "default";
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
	default: {
		id: "default",
		label: "Default",
		themeFragments: [
			"theme/tokens/default.css",
			"theme/base.css",
			"theme/presets/article.css",
			"theme/features/default.css",
		],
		hljsFragments: ["hljs/base.css", "hljs/variants/default.css"],
		features: {
			showToc: true,
			showColorModeToggle: true,
		},
	},
	resume: {
		id: "resume",
		label: "Resume",
		themeFragments: [
			"theme/tokens/resume.css",
			"theme/base.css",
			"theme/presets/resume.css",
		],
		hljsFragments: ["hljs/base.css", "hljs/variants/resume.css"],
		features: {
			showToc: false,
			showColorModeToggle: false,
		},
	},
	github: {
		id: "github",
		label: "GitHub",
		themeFragments: [
			"theme/tokens/github.css",
			"theme/base.css",
			"theme/presets/github.css",
			"theme/features/default.css",
		],
		hljsFragments: ["hljs/base.css", "hljs/variants/github.css"],
		features: {
			showToc: false,
			showColorModeToggle: true,
		},
	},
	matrix: {
		id: "matrix",
		label: "Matrix",
		themeFragments: [
			"theme/tokens/matrix.css",
			"theme/base.css",
			"theme/presets/matrix.css",
		],
		hljsFragments: ["hljs/base.css", "hljs/variants/matrix.css"],
		features: {
			showToc: false,
			showColorModeToggle: false,
		},
	},
};

export function getThemeDefinition(value?: string | null): ThemeDefinition {
	return THEMES[resolveThemeId(value)];
}

export function getThemePaths(value?: string | null) {
	const theme = getThemeDefinition(value);

	return {
		themePath: `/themes/${theme.id}.css`,
		hljsThemePath: `/themes/${theme.id}.hljs.css`,
	};
}

export const THEME_OPTIONS = THEME_IDS.map((id) => ({
	value: id,
	label: THEMES[id].label,
}));

const PRIMARY_THEME_IDS = ["default", "resume", "github"] as const;
const OVERFLOW_THEME_IDS = ["matrix"] as const;

export const PRIMARY_THEME_OPTIONS = PRIMARY_THEME_IDS.map((id) => ({
	value: id,
	label: THEMES[id].label,
}));

export const OVERFLOW_THEME_OPTIONS = OVERFLOW_THEME_IDS.map((id) => ({
	value: id,
	label: THEMES[id].label,
}));
