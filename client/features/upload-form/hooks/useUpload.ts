import { resolveThemeId, type ThemeId } from "@shared/themes/theme-registry";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { trpc } from "@/utils/trpc";

const DAY_MS = 24 * 60 * 60 * 1000;
const VALID_PUBLIC_EXPIRATION_DAYS = [1, 7, 14, 30] as const;
type PublicExpirationDays = (typeof VALID_PUBLIC_EXPIRATION_DAYS)[number];

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
	theme: ThemeId;
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
	handleUpload: (options?: {
		localImages?: Array<{ originalPath: string; file: File }>;
	}) => Promise<void>;
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
	const publicCreateMutation = useMutation(
		trpc.upload.publicCreate.mutationOptions(),
	);
	const userCreateMutation = useMutation(
		trpc.upload.userCreate.mutationOptions(),
	);

	const handleUpload = useCallback(
		async (options?: {
			localImages?: Array<{ originalPath: string; file: File }>;
		}) => {
			if (!file) return;

			setIsUploading(true);
			setUploadError(null);
			setUploadErrorStatus(null);

			try {
				const markdown = await file.text();
				const coercedTheme = resolveThemeId(theme);
				const formData = new FormData();
				formData.append("markdown", markdown);
				formData.append("theme", coercedTheme);

				const localImages = options?.localImages ?? [];
				if (localImages.length > 0) {
					formData.append(
						"imageMap",
						JSON.stringify(
							localImages.map((image, index) => ({
								originalPath: image.originalPath,
								field: `image_${index}`,
							})),
						),
					);
					localImages.forEach((image, index) => {
						formData.append(`image_${index}`, image.file);
					});
				}

				const path = isAuthenticated
					? (() => {
							if (expirationDays !== -1) {
								formData.append(
									"expiresAtMs",
									String(Date.now() + expirationDays * DAY_MS),
								);
							}
							return userCreateMutation.mutateAsync(formData);
						})()
					: (() => {
							formData.append(
								"expirationDays",
								String(toPublicExpirationDays(expirationDays)),
							);
							if (turnstileToken) {
								formData.append("turnstileToken", turnstileToken);
							}
							return publicCreateMutation.mutateAsync(formData);
						})();

				const resolvedPath = (await path).path;
				const viewUrl = `${window.location.origin}/${resolvedPath}`;
				setUploadedUrl(viewUrl);
				onSuccess();
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unknown error";
				setUploadError(message);
				setUploadErrorStatus(getTrpcHttpStatus(error));
				// Auto clear error after 2 seconds
				setTimeout(() => {
					setUploadError(null);
					setUploadErrorStatus(null);
				}, 2000);
			} finally {
				setIsUploading(false);
				if (import.meta.env.PROD) {
					(
						window as typeof window & {
							turnstile?: { reset?: () => void };
						}
					).turnstile?.reset?.();
				}
			}
		},
		[
			file,
			expirationDays,
			theme,
			turnstileToken,
			isAuthenticated,
			onSuccess,
			publicCreateMutation,
			userCreateMutation,
		],
	);

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
