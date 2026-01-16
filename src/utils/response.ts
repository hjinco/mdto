/**
 * Response utility functions for creating standardized HTTP responses
 */

/**
 * Create a JSON response
 * @param data - Object to serialize as JSON
 * @param status - HTTP status code (default: 200)
 * @returns Response with JSON content
 */
export function json(data: object, status: number = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

/**
 * Create an HTML response
 * @param html - HTML content string
 * @param status - HTTP status code (default: 200)
 * @returns Response with HTML content
 */
export function html(html: string, status: number = 200): Response {
	return new Response(html, {
		status,
		headers: { "Content-Type": "text/html; charset=utf-8" },
	});
}

/**
 * Create a plain text response
 * @param text - Text content string
 * @param status - HTTP status code (default: 200)
 * @returns Response with plain text content
 */
export function text(text: string, status: number = 200): Response {
	return new Response(text, { status });
}

/**
 * Create an error response (JSON format)
 * @param message - Error message
 * @param status - HTTP status code (default: 500)
 * @returns Response with error JSON
 */
export function exception(message: string, status: number = 500): Response {
	return json({ error: message }, status);
}
