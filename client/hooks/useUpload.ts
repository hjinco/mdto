import { useCallback, useState } from "react";
import { useTurnstile } from "react-turnstile";

interface UseUploadOptions {
	file: File | null;
	expirationDays: number;
	theme: string;
	turnstileToken: string | null;
	onSuccess?: () => void;
	onClearFile?: () => void;
}

interface UseUploadReturn {
	isUploading: boolean;
	uploadedUrl: string | null;
	handleUpload: () => Promise<void>;
	handleReset: () => void;
}

export function useUpload({
	file,
	expirationDays,
	theme,
	turnstileToken,
	onSuccess,
	onClearFile,
}: UseUploadOptions): UseUploadReturn {
	const [isUploading, setIsUploading] = useState(false);
	const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
	const turnstile = useTurnstile();

	const handleUpload = useCallback(async () => {
		if (!file) return;

		setIsUploading(true);

		try {
			const text = await file.text();

			const headers: Record<string, string> = { "Content-Type": "text/plain" };
			if (turnstileToken) {
				headers["X-Turnstile-Token"] = turnstileToken;
			}

			const response = await fetch(
				`/api/upload?expiration=${expirationDays}&theme=${theme}`,
				{
					method: "POST",
					headers,
					body: text,
				},
			);

			const data = await response.json();

			if (response.ok && data.slug) {
				const viewUrl = `${window.location.origin}/${data.slug}`;
				setUploadedUrl(viewUrl);
				onSuccess?.();
			} else {
				turnstile.reset();
				throw new Error(data.error || "Failed to create page");
			}
		} catch (error) {
			turnstile.reset();
			alert(
				`Failed to create page: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		} finally {
			setIsUploading(false);
		}
	}, [file, expirationDays, theme, turnstileToken, turnstile, onSuccess]);

	const handleReset = useCallback(() => {
		setUploadedUrl(null);
		onClearFile?.();
	}, [onClearFile]);

	return {
		isUploading,
		uploadedUrl,
		handleUpload,
		handleReset,
	};
}
