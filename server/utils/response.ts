/**
 * Response utility functions for creating standardized HTTP responses
 */

/**
 * Create a JSON response
 * @param data - Object to serialize as JSON
 * @param status - HTTP status code (default: 200)
 * @param cacheControl - Optional Cache-Control header value
 * @returns Response with JSON content
 */
export function json(
	data: object,
	status: number = 200,
	cacheControl?: string,
): Response {
	const headers: HeadersInit = { "Content-Type": "application/json" };
	if (cacheControl) {
		headers["Cache-Control"] = cacheControl;
	}
	return new Response(JSON.stringify(data), {
		status,
		headers,
	});
}

/**
 * Create an HTML response
 * @param html - HTML content string
 * @param status - HTTP status code (default: 200)
 * @param cacheControl - Optional Cache-Control header value
 * @returns Response with HTML content
 */
export function html(
	html: string,
	status: number = 200,
	cacheControl?: string,
): Response {
	const headers: HeadersInit = { "Content-Type": "text/html; charset=utf-8" };
	if (cacheControl) {
		headers["Cache-Control"] = cacheControl;
	}
	return new Response(html, {
		status,
		headers,
	});
}

/**
 * Create a plain text response
 * @param text - Text content string
 * @param status - HTTP status code (default: 200)
 * @param cacheControl - Optional Cache-Control header value
 * @returns Response with plain text content
 */
export function text(
	text: string,
	status: number = 200,
	cacheControl?: string,
): Response {
	const headers: HeadersInit = {};
	if (cacheControl) {
		headers["Cache-Control"] = cacheControl;
	}
	return new Response(text, { status, headers });
}

/**
 * Create an error response (JSON format)
 * @param message - Error message
 * @param status - HTTP status code (default: 500)
 * @returns Response with error JSON
 */
export function exception(message: string, status: number = 500): Response {
	// Error responses should not be cached
	return json({ error: message }, status, "no-cache");
}
