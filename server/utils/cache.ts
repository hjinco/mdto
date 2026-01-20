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
