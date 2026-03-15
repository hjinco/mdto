import { SELF } from "cloudflare:test";

export type WorkerFetchResult<T> = {
	response: Response;
	status: number;
	body: T;
};

export async function workerFetch<T>(
	input: string | URL,
	init: RequestInit = {},
): Promise<WorkerFetchResult<T>> {
	const response = await SELF.fetch(input, init);
	const text = await response.text();
	let body: T;

	if (text.length === 0) {
		body = null as T;
	} else {
		try {
			body = JSON.parse(text) as T;
		} catch {
			body = text as T;
		}
	}

	return {
		response,
		status: response.status,
		body,
	};
}
