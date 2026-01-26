import { useCallback, useEffect, useRef, useState } from "react";

export const ALLOWED_EXTENSIONS = [".md", ".markdown", ".txt"];

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
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
			return;
		}

		if (file.size > 100 * 1024) {
			alert("File size exceeds 100KB");
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
			return;
		}

		setSelectedFile(file);
	}, []);

	// Check for pre-hydration file selection
	useEffect(() => {
		if (fileInputRef.current?.files?.length && !selectedFile) {
			const file = fileInputRef.current.files[0];
			handleFileSelect(file);
		}
	}, [handleFileSelect, selectedFile]);

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
