import { useCallback, useEffect, useState } from "react";

interface UseResizablePaneOptions {
	initialWidth?: number;
	minWidth?: number;
	maxWidth?: number;
}

export function useResizablePane({
	initialWidth = 50,
	minWidth = 20,
	maxWidth = 80,
}: UseResizablePaneOptions = {}) {
	const [width, setWidth] = useState(initialWidth);
	const [isResizing, setIsResizing] = useState(false);

	const startResizing = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		setIsResizing(true);
	}, []);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isResizing) return;

			// Calculate percentage based on window width
			const newWidth = (e.clientX / window.innerWidth) * 100;

			// Clamp between min and max
			if (newWidth >= minWidth && newWidth <= maxWidth) {
				setWidth(newWidth);
			}
		};

		const handleMouseUp = () => {
			setIsResizing(false);
		};

		if (isResizing) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
			document.body.style.userSelect = "none";
			document.body.style.cursor = "col-resize";
		}

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
			document.body.style.userSelect = "";
			document.body.style.cursor = "";
		};
	}, [isResizing, minWidth, maxWidth]);

	return {
		width,
		isResizing,
		startResizing,
	};
}
