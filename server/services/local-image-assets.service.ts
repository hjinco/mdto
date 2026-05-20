import { analyzeLocalImageReferences } from "@shared/markdown";
import { TRPCError } from "@trpc/server";
import { deleteObjects, putAssetObject } from "../infra/r2";

export type LocalImageFile = {
	originalPath: string;
	file: File;
};

type UploadLocalImagesInput = {
	env: Env;
	markdown: string;
	images: LocalImageFile[];
};

export type UploadedPageAsset = {
	id: string;
	originalPath: string;
	fileName: string;
	contentType: string;
	size: number;
};

export function getAssetR2Key(assetId: string) {
	return `assets/${assetId}`;
}

export function getAssetPublicPath(assetId: string) {
	return `/assets/${assetId}`;
}

export async function uploadAndRewriteLocalImages({
	env,
	markdown,
	images,
}: UploadLocalImagesInput) {
	const analysis = analyzeLocalImageReferences(markdown);
	const detectedPaths = new Set(
		analysis.references.map((reference) => reference.originalPath),
	);
	const uploadedPaths = new Set<string>();
	const replacements = new Map<string, string>();
	const assets: UploadedPageAsset[] = [];

	for (const image of images) {
		if (uploadedPaths.has(image.originalPath)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "imageMap includes a duplicate path",
			});
		}
		uploadedPaths.add(image.originalPath);
	}

	for (const originalPath of uploadedPaths) {
		if (!detectedPaths.has(originalPath)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "imageMap includes an unknown path",
			});
		}
	}

	for (const originalPath of detectedPaths) {
		if (!uploadedPaths.has(originalPath)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "imageMap is missing files for referenced images",
			});
		}
	}

	if (images.length === 0) {
		return { markdown, assets: [] satisfies UploadedPageAsset[] };
	}

	try {
		for (const image of images) {
			const assetId = crypto.randomUUID();
			const key = getAssetR2Key(assetId);
			const publicPath = getAssetPublicPath(assetId);
			await putAssetObject(env, key, image.file);
			replacements.set(image.originalPath, publicPath);
			assets.push({
				id: assetId,
				originalPath: image.originalPath,
				fileName: image.file.name,
				contentType: image.file.type,
				size: image.file.size,
			});
		}
	} catch (error) {
		await deleteObjects(
			env,
			assets.map((asset) => getAssetR2Key(asset.id)),
		);
		throw error;
	}

	return {
		markdown: analysis.rewrite(replacements),
		assets,
	};
}
