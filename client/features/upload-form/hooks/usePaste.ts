import { useEffect } from "react";
import { ALLOWED_EXTENSIONS } from "./useFileSelection";

interface UsePasteOptions {
	onPaste: (file: File) => void;
	canPaste?: boolean;
}

export function usePaste({ onPaste, canPaste = true }: UsePasteOptions) {
	useEffect(() => {
		const handlePaste = (e: ClipboardEvent) => {
			if (!canPaste) return;

			const target = e.target;
			const isEditableTarget =
				target instanceof HTMLElement &&
				(target.isContentEditable ||
					target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA");

			if (e.clipboardData?.files.length) {
				const file = e.clipboardData.files[0];

				const fileName = file.name.toLowerCase();
				const isValidExtension = ALLOWED_EXTENSIONS.some((ext: string) =>
					fileName.endsWith(ext),
				);

				if (isValidExtension) {
					e.preventDefault();
					onPaste(file);
				}
				return;
			}

			if (isEditableTarget) return;

			const rawText =
				e.clipboardData?.getData("text/plain") ||
				e.clipboardData?.getData("text/markdown") ||
				"";
			const text = rawText.trim();
			if (!text) return;

			e.preventDefault();
			onPaste(new File([rawText], "pasted.md", { type: "text/markdown" }));
		};

		document.addEventListener("paste", handlePaste);
		return () => document.removeEventListener("paste", handlePaste);
	}, [onPaste, canPaste]);
}
