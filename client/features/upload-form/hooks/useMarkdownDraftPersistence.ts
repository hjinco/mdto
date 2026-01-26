import { useCallback, useEffect, useRef } from "react";

const MARKDOWN_DRAFT_STORAGE_KEY = "markdownDraft-v1";

type MarkdownDraft = {
	name: string;
	markdown: string;
	savedAtMs: number;
};

function loadMarkdownDraft(): MarkdownDraft | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(MARKDOWN_DRAFT_STORAGE_KEY);
		if (!raw) return null;

		const parsed = JSON.parse(raw) as Partial<MarkdownDraft> | null;
		if (!parsed || typeof parsed.markdown !== "string") return null;

		const name =
			typeof parsed.name === "string" && parsed.name.trim()
				? parsed.name.trim()
				: "draft.md";

		return {
			name,
			markdown: parsed.markdown,
			savedAtMs: typeof parsed.savedAtMs === "number" ? parsed.savedAtMs : 0,
		};
	} catch {
		return null;
	}
}

function saveMarkdownDraft(draft: { name: string; markdown: string }) {
	if (typeof window === "undefined") return;
	try {
		const payload: MarkdownDraft = {
			name: draft.name,
			markdown: draft.markdown,
			savedAtMs: Date.now(),
		};
		window.localStorage.setItem(
			MARKDOWN_DRAFT_STORAGE_KEY,
			JSON.stringify(payload),
		);
	} catch {
		// Ignore storage errors (quota, privacy mode, etc).
	}
}

function clearMarkdownDraft() {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.removeItem(MARKDOWN_DRAFT_STORAGE_KEY);
	} catch {
		// Ignore.
	}
}

interface UseMarkdownDraftPersistenceOptions {
	selectedFile: File | null;
	onRestoreFile: (file: File) => void;
}

export function useMarkdownDraftPersistence({
	selectedFile,
	onRestoreFile,
}: UseMarkdownDraftPersistenceOptions) {
	const hasRestoredDraftRef = useRef(false);

	const clearDraft = useCallback(() => {
		clearMarkdownDraft();
	}, []);

	useEffect(() => {
		if (hasRestoredDraftRef.current) return;
		hasRestoredDraftRef.current = true;

		if (selectedFile) return;
		const draft = loadMarkdownDraft();
		if (!draft) return;

		try {
			onRestoreFile(
				new File([draft.markdown], draft.name, { type: "text/markdown" }),
			);
		} catch {
			// Ignore.
		}
	}, [onRestoreFile, selectedFile]);

	useEffect(() => {
		if (!selectedFile) return;

		let isCancelled = false;
		void (async () => {
			try {
				const markdown = await selectedFile.text();
				if (isCancelled) return;
				saveMarkdownDraft({ name: selectedFile.name || "draft.md", markdown });
			} catch {
				// Ignore.
			}
		})();

		return () => {
			isCancelled = true;
		};
	}, [selectedFile]);

	return { clearDraft };
}
