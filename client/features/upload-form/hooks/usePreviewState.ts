import { useCallback, useState } from "react";

interface UsePreviewStateReturn {
	showPreview: boolean;
	isPreviewLoading: boolean;
	setIsPreviewLoading: (loading: boolean) => void;
	togglePreview: () => void;
	closePreview: () => void;
}

export function usePreviewState(): UsePreviewStateReturn {
	const [showPreview, setShowPreview] = useState(false);
	const [isPreviewLoading, setIsPreviewLoading] = useState(false);

	const togglePreview = useCallback(() => {
		setShowPreview((prev) => {
			if (prev) {
				setIsPreviewLoading(false);
			}
			return !prev;
		});
	}, []);

	const closePreview = useCallback(() => {
		setShowPreview(false);
		setIsPreviewLoading(false);
	}, []);

	return {
		showPreview,
		isPreviewLoading,
		setIsPreviewLoading,
		togglePreview,
		closePreview,
	};
}
