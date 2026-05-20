import { db } from "@server/db/client";
import type { LocalImageFile } from "@server/services/local-image-assets.service";
import {
	createUploadService,
	expirationDaysSchema,
	type PublicCreateInput,
	themeSchema,
	type UserCreateInput,
} from "@server/services/upload.service";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

const MAX_IMAGE_COUNT = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
	"image/gif",
	"image/jpeg",
	"image/png",
	"image/webp",
]);

type ImageMapEntry = {
	originalPath: string;
	field: string;
};

function getRequiredString(formData: FormData, key: string) {
	const value = formData.get(key);
	if (typeof value !== "string") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `${key} is required`,
		});
	}
	return value;
}

function getOptionalString(formData: FormData, key: string) {
	const value = formData.get(key);
	return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function assertFileIsAllowed(file: File) {
	if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Unsupported image type",
		});
	}

	if (file.size > MAX_IMAGE_SIZE) {
		throw new TRPCError({
			code: "PAYLOAD_TOO_LARGE",
			message: "Image size exceeds 5MB limit",
		});
	}
}

function parseLocalImageFiles(formData: FormData): LocalImageFile[] {
	const rawImageMap = getOptionalString(formData, "imageMap");
	if (!rawImageMap) return [];

	let parsed: unknown;
	try {
		parsed = JSON.parse(rawImageMap);
	} catch {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Invalid imageMap",
		});
	}

	if (!Array.isArray(parsed)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Invalid imageMap",
		});
	}

	const imageMap = parsed.map((entry): ImageMapEntry => {
		if (
			!entry ||
			typeof entry !== "object" ||
			typeof (entry as ImageMapEntry).originalPath !== "string" ||
			typeof (entry as ImageMapEntry).field !== "string"
		) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Invalid imageMap",
			});
		}

		return {
			originalPath: (entry as ImageMapEntry).originalPath,
			field: (entry as ImageMapEntry).field,
		};
	});

	if (imageMap.length > MAX_IMAGE_COUNT) {
		throw new TRPCError({
			code: "PAYLOAD_TOO_LARGE",
			message: `You can upload up to ${MAX_IMAGE_COUNT} images per page`,
		});
	}

	return imageMap.map((entry) => {
		const value = formData.get(entry.field);
		if (!(value instanceof File)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Missing image file",
			});
		}
		assertFileIsAllowed(value);

		return {
			originalPath: entry.originalPath,
			file: value,
		};
	});
}

function parsePublicCreateFormData(formData: FormData): PublicCreateInput {
	const localImages = parseLocalImageFiles(formData);
	if (localImages.length > 0) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Login is required to upload local images",
		});
	}

	return {
		markdown: getRequiredString(formData, "markdown"),
		expirationDays: expirationDaysSchema.parse(
			Number(getOptionalString(formData, "expirationDays") ?? 30),
		),
		theme: themeSchema.parse(getOptionalString(formData, "theme") ?? "default"),
		turnstileToken: getOptionalString(formData, "turnstileToken"),
	};
}

function parseUserCreateFormData(formData: FormData): UserCreateInput {
	const expiresAtMsValue = getOptionalString(formData, "expiresAtMs");
	const expiresAtMs =
		expiresAtMsValue === null ? null : Number(expiresAtMsValue);
	if (expiresAtMs !== null && !Number.isFinite(expiresAtMs)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Invalid expiresAtMs",
		});
	}

	return {
		markdown: getRequiredString(formData, "markdown"),
		theme: themeSchema.parse(getOptionalString(formData, "theme") ?? "default"),
		expiresAtMs,
		localImages: parseLocalImageFiles(formData),
	};
}

export const uploadRouter = router({
	publicCreate: publicProcedure
		.input(z.instanceof(FormData))
		.mutation(async ({ ctx, input }) => {
			const uploadService = createUploadService({
				env: ctx.env,
				req: ctx.req,
				db,
			});
			return uploadService.publicCreate(parsePublicCreateFormData(input));
		}),

	userCreate: protectedProcedure
		.input(z.instanceof(FormData))
		.mutation(async ({ ctx, input }) => {
			const uploadService = createUploadService({
				env: ctx.env,
				req: ctx.req,
				db,
			});
			return uploadService.userCreate(
				parseUserCreateFormData(input),
				ctx.session.user,
			);
		}),
});
