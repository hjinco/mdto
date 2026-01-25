import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTurnstile } from "react-turnstile";
import { trpc } from "../utils/trpc";

const DAY_MS = 24 * 60 * 60 * 1000;
const VALID_PUBLIC_EXPIRATION_DAYS = [1, 7, 14, 30] as const;
type PublicExpirationDays = (typeof VALID_PUBLIC_EXPIRATION_DAYS)[number];
type Theme = "default" | "resume" | "matrix";

function toTheme(theme: string): Theme {
	if (theme === "default" || theme === "resume" || theme === "matrix")
		return theme;
	return "default";
}

function toPublicExpirationDays(days: number): PublicExpirationDays {
	if ((VALID_PUBLIC_EXPIRATION_DAYS as readonly number[]).includes(days)) {
		return days as PublicExpirationDays;
	}
	return 30;
}

function getTrpcHttpStatus(error: unknown): number | null {
	const status = (error as { data?: { httpStatus?: unknown } } | undefined)
		?.data?.httpStatus;
	return typeof status === "number" ? status : null;
}

interface UseUploadOptions {
	file: File | null;
	expirationDays: number;
	theme: string;
	turnstileToken: string | null;
	isAuthenticated: boolean;
	onSuccess: () => void;
	onClearFile: () => void;
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

	const publicCreateMutation = useMutation(
		trpc.upload.publicCreate.mutationOptions(),
	);
	const userCreateMutation = useMutation(
		trpc.upload.userCreate.mutationOptions(),
	);

	const handleUpload = useCallback(async () => {
		if (!file) return;

		setIsUploading(true);
		setUploadError(null);
		setUploadErrorStatus(null);

		try {
			const markdown = await file.text();
			const coercedTheme = toTheme(theme);

			const path = isAuthenticated
				? (
						await userCreateMutation.mutateAsync({
							markdown,
							theme: coercedTheme,
							expiresAtMs:
								expirationDays === -1
									? null
									: Date.now() + expirationDays * DAY_MS,
						})
					).path
				: (
						await publicCreateMutation.mutateAsync({
							markdown,
							theme: coercedTheme,
							expirationDays: toPublicExpirationDays(expirationDays),
							turnstileToken,
						})
					).path;

			const viewUrl = `${window.location.origin}/${path}`;
			setUploadedUrl(viewUrl);
			onSuccess();
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			setUploadError(message);
			setUploadErrorStatus(getTrpcHttpStatus(error));
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
		publicCreateMutation,
		userCreateMutation,
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
