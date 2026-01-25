import { useCallback, useState } from "react";
import { useTurnstile } from "react-turnstile";

const DAY_MS = 24 * 60 * 60 * 1000;

interface UseUploadOptions {
	file: File | null;
	expirationDays: number;
	theme: string;
	turnstileToken: string | null;
	isAuthenticated: boolean;
	onSuccess?: () => void;
	onClearFile?: () => void;
}

interface UseUploadReturn {
	isUploading: boolean;
	uploadedUrl: string | null;
	uploadError: string | null;
	uploadErrorStatus: number | null;
	handleUpload: () => Promise<void>;
	handleReset: () => void;
}

export function useUpload({
	file,
	expirationDays,
	theme,
	turnstileToken,
	isAuthenticated,
	onSuccess,
	onClearFile,
}: UseUploadOptions): UseUploadReturn {
	const [isUploading, setIsUploading] = useState(false);
	const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [uploadErrorStatus, setUploadErrorStatus] = useState<number | null>(
		null,
	);
	const turnstile = useTurnstile();

	const handleUpload = useCallback(async () => {
		if (!file) return;

		setIsUploading(true);
		setUploadError(null);
		setUploadErrorStatus(null);

		try {
			const text = await file.text();

			const headers: Record<string, string> = { "Content-Type": "text/plain" };
			if (turnstileToken) {
				headers["X-Turnstile-Token"] = turnstileToken;
			}

			const endpoint = isAuthenticated ? "/api/u/upload" : "/api/upload";
			const query = new URLSearchParams({ theme });
			if (isAuthenticated) {
				if (expirationDays === -1) {
					// Permanent: send empty expiresAt as requested (`?expiresAt=`)
					query.set("expiresAt", "");
				} else {
					const expiresAtMs = Date.now() + expirationDays * DAY_MS;
					query.set("expiresAt", expiresAtMs.toString());
				}
			} else {
				query.set("expiration", expirationDays.toString());
			}
			const response = await fetch(`${endpoint}?${query.toString()}`, {
				method: "POST",
				headers,
				body: text,
				credentials: "include",
			});

			let data: unknown = null;
			try {
				data = await response.json();
			} catch {
				data = null;
			}

			const maybeObj = data as {
				slug?: unknown;
				path?: unknown;
				error?: unknown;
			};
			const slugOrPath =
				typeof maybeObj?.slug === "string"
					? maybeObj.slug
					: typeof maybeObj?.path === "string"
						? maybeObj.path
						: undefined;
			if (response.ok && slugOrPath) {
				const viewUrl = `${window.location.origin}/${slugOrPath}`;
				setUploadedUrl(viewUrl);
				onSuccess?.();
			} else {
				const message =
					typeof maybeObj?.error === "string"
						? maybeObj.error
						: `Failed to create page (${response.status})`;
				const err = new Error(message) as Error & { status?: number };
				err.status = response.status;
				throw err;
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			setUploadError(message);
			setUploadErrorStatus(
				typeof (error as { status?: unknown })?.status === "number"
					? (error as { status: number }).status
					: null,
			);
			// Auto clear error after 2 seconds
			setTimeout(() => {
				setUploadError(null);
				setUploadErrorStatus(null);
			}, 2000);
		} finally {
			setIsUploading(false);
			if (import.meta.env.PROD) turnstile.reset();
		}
	}, [
		file,
		expirationDays,
		theme,
		turnstileToken,
		isAuthenticated,
		onSuccess,
		turnstile,
	]);

	const handleReset = useCallback(() => {
		setUploadedUrl(null);
		setUploadError(null);
		setUploadErrorStatus(null);
		onClearFile?.();
	}, [onClearFile]);

	return {
		isUploading,
		uploadedUrl,
		uploadError,
		uploadErrorStatus,
		handleUpload,
		handleReset,
	};
}
