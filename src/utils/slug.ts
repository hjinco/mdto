import { nanoid } from "nanoid";

/**
 * Generate a unique slug using nanoid(5)
 * @returns A 5-character unique slug
 */
export function generateSlug(): string {
	return nanoid(5);
}

/**
 * Validate slug format (should be alphanumeric with underscore/hyphen, exactly 5 characters)
 * @param slug - The slug to validate
 * @returns true if the slug is valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
	return !!slug && /^[a-zA-Z0-9_-]{5}$/.test(slug);
}
