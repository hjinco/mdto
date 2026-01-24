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
	uploadError: string | null;
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
	const [uploadError, setUploadError] = useState<string | null>(null);
	const turnstile = useTurnstile();

	const handleUpload = useCallback(async () => {
		if (!file) return;

		setIsUploading(true);
		setUploadError(null);

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
				throw new Error(data.error || "Failed to create page");
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			setUploadError(message);
			// Auto clear error after 2 seconds
			setTimeout(() => setUploadError(null), 2000);
		} finally {
			setIsUploading(false);
			if (import.meta.env.PROD) turnstile.reset();
		}
	}, [file, expirationDays, theme, turnstileToken, onSuccess, turnstile]);

	const handleReset = useCallback(() => {
		setUploadedUrl(null);
		setUploadError(null);
		onClearFile?.();
	}, [onClearFile]);

	return {
		isUploading,
		uploadedUrl,
		uploadError,
		handleUpload,
		handleReset,
	};
}
