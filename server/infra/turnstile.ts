/**
 * Cloudflare Turnstile validation utility
 * Validates Turnstile tokens using Cloudflare's Siteverify API
 */

const SITEVERIFY_URL =
	"https://challenges.cloudflare.com/turnstile/v0/siteverify";
const VALIDATION_TIMEOUT = 10000; // 10 seconds

export interface TurnstileValidationResult {
	success: boolean;
	"error-codes"?: string[];
	challenge_ts?: string;
	hostname?: string;
	action?: string;
	cdata?: string;
	metadata?: {
		ephemeral_id?: string;
	};
}

/**
 * Validate a Turnstile token using Cloudflare's Siteverify API
 * @param token - The Turnstile token from the client
 * @param remoteip - The visitor's IP address (optional but recommended)
 * @param secretKey - Your Turnstile secret key
 * @returns Promise resolving to validation result
 */
export async function validateTurnstile(
	token: string,
	remoteip: string | null,
	secretKey: string,
): Promise<TurnstileValidationResult> {
	// Input validation
	if (!token || typeof token !== "string") {
		return {
			success: false,
			"error-codes": ["missing-input-response"],
		};
	}

	if (token.length > 2048) {
		return {
			success: false,
			"error-codes": ["invalid-input-response"],
		};
	}

	if (!secretKey) {
		return {
			success: false,
			"error-codes": ["missing-input-secret"],
		};
	}

	// Prepare FormData
	const formData = new FormData();
	formData.append("secret", secretKey);
	formData.append("response", token);
	if (remoteip) {
		formData.append("remoteip", remoteip);
	}

	// Create AbortController for timeout
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), VALIDATION_TIMEOUT);

	try {
		const response = await fetch(SITEVERIFY_URL, {
			method: "POST",
			body: formData,
			signal: controller.signal,
		});

		const result = (await response.json()) as TurnstileValidationResult;
		return result;
	} catch (error) {
		// Handle timeout
		if (error instanceof Error && error.name === "AbortError") {
			console.error("Turnstile validation timeout");
			return {
				success: false,
				"error-codes": ["internal-error"],
			};
		}

		// Handle other errors
		console.error("Turnstile validation error:", error);
		return {
			success: false,
			"error-codes": ["internal-error"],
		};
	} finally {
		clearTimeout(timeoutId);
	}
}

/**
 * Extract remote IP address from request headers
 * Prioritizes Cloudflare headers, falls back to standard headers
 * @param request - The incoming request
 * @returns IP address string or null if not found
 */
export function getRemoteIp(request: Request): string | null {
	const headers = request.headers;
	return (
		headers.get("CF-Connecting-IP") ||
		headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
		null
	);
}
