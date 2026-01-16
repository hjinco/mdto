/**
 * Retry a function until a condition is met or max retries is reached
 * @param fn - Function to execute that returns a value to check
 * @param condition - Function that checks if the result meets the condition (returns true if condition is met)
 * @param maxRetries - Maximum number of retries (default: 5)
 * @returns The result that meets the condition, or null if max retries exceeded
 */
export async function retryUntil<T>(
	fn: () => Promise<T>,
	condition: (result: T) => Promise<boolean> | boolean,
	maxRetries: number = 5,
): Promise<T | null> {
	let retries = 0;

	while (retries < maxRetries) {
		const result = await fn();
		const meetsCondition = await condition(result);
		if (meetsCondition) {
			return result;
		}
		retries++;
	}

	return null;
}
