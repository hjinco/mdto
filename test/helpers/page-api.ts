import { auth } from "../../server/lib/auth";
import { type WorkerFetchResult, workerFetch } from "./worker-http";

export type IssuedApiKey = {
	id: string;
	key: string;
	name: string | null;
	prefix: string | null;
	start: string | null;
	createdAt: string;
	updatedAt: string;
};

export type PageApiFetchResult<T> = WorkerFetchResult<T>;

export async function issueApiKey(
	userId: string,
	name = "test-api-key",
): Promise<IssuedApiKey> {
	const result = await auth.api.createApiKey({
		body: {
			userId,
			name,
		},
	});

	if (!result?.key) {
		throw new Error("Failed to issue test API key");
	}

	return result as IssuedApiKey;
}

export async function pagesApiFetch<T>(
	path = "",
	init: RequestInit = {},
	apiKey?: string,
): Promise<PageApiFetchResult<T>> {
	const headers = new Headers(init.headers);

	if (apiKey) {
		headers.set("x-api-key", apiKey);
	}

	if (init.body !== undefined && !headers.has("content-type")) {
		headers.set("content-type", "application/json");
	}

	return workerFetch<T>(`http://localhost/api/v1/pages${path}`, {
		...init,
		headers,
	});
}
