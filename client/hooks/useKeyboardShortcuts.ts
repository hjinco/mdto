import { useEffect } from "react";

interface UseKeyboardShortcutsOptions {
	onOpenFile?: () => void;
	onClosePreview?: () => void;
	canOpenFile?: boolean;
	canClosePreview?: boolean;
}

export function useKeyboardShortcuts({
	onOpenFile,
	onClosePreview,
	canOpenFile = true,
	canClosePreview = false,
}: UseKeyboardShortcutsOptions) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// ⌘O / Ctrl+O to open file picker
			if ((e.metaKey || e.ctrlKey) && e.key === "o") {
				e.preventDefault();
				if (canOpenFile) {
					onOpenFile?.();
				}
			}

			// Escape to close preview
			if (e.key === "Escape" && canClosePreview) {
				onClosePreview?.();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onOpenFile, onClosePreview, canOpenFile, canClosePreview]);
}
