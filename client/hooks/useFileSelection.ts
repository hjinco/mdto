import { useCallback, useRef, useState } from "react";

const ALLOWED_EXTENSIONS = [".md", ".markdown", ".txt"];

export function useFileSelection() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = useCallback((file: File) => {
		const fileName = file.name.toLowerCase();
		const isValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
			fileName.endsWith(ext),
		);

		if (!isValidExtension) {
			alert("Please select a .md, .markdown, or .txt file only");
			return;
		}

		setSelectedFile(file);
	}, []);

	const clearSelection = useCallback(() => {
		setSelectedFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}, []);

	return {
		selectedFile,
		fileInputRef,
		handleFileSelect,
		clearSelection,
	};
}
