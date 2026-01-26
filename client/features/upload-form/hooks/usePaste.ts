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
			}
		};

		document.addEventListener("paste", handlePaste);
		return () => document.removeEventListener("paste", handlePaste);
	}, [onPaste, canPaste]);
}
