/**
 * Generate Cache-Control header based on max age.
 *
 * @param maxAge - Max age in seconds
 * @returns Cache-Control header value
 */
export function cacheControlHeader(maxAge: number): string {
	return `public, max-age=${maxAge}, immutable`;
}

/**
 * Generate an ETag that is both template-aware and document-specific.
 * Combines the template version with the underlying R2 object's ETag
 * to avoid cross-document collisions while remaining stable for the same document.
 *
 * @param params.templateHash - Template hash string
 * @param params.objectEtag - R2 object's ETag (unique per object/content)
 * @returns Weak ETag header value
 */
export function generateETag(params: {
	templateHash: string;
	objectEtag: string;
}): string {
	return `W/"${params.templateHash}:${params.objectEtag}"`;
}

export function getViewCachePaths(path: string | null | undefined) {
	if (!path) return [];
	return [path, `${path}.md`];
}

export async function purgePathsFromCache(
	baseUrl: string,
	paths: Array<string | null | undefined>,
) {
	const cache = (caches as unknown as { default?: Cache }).default;
	if (!cache) return;

	await Promise.all(
		paths
			.filter((path): path is string => Boolean(path))
			.map((path) => {
				const url = new URL(path, baseUrl);
				return cache.delete(new Request(url.toString(), { method: "GET" }));
			}),
	);
}
