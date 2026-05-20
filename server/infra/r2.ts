export type R2JsonPayload = {
	html: string;
	markdown: string;
};

export type R2CustomMetadataInput = {
	theme: string;
	lang?: string;
	title?: string;
	description?: string;
	hasCodeBlock?: boolean;
	hasKatex?: boolean;
	hasMermaid?: boolean;
	hasWikiLink?: boolean;
};

function toR2Metadata(input: R2CustomMetadataInput): Record<string, string> {
	return {
		theme: input.theme,
		lang: input.lang || "",
		title: input.title || "",
		description: input.description || "",
		hasCodeBlock: input.hasCodeBlock ? "1" : "",
		hasKatex: input.hasKatex ? "1" : "",
		hasMermaid: input.hasMermaid ? "1" : "",
		hasWikiLink: input.hasWikiLink ? "1" : "",
	};
}

export async function getObject(env: Env, key: string) {
	return env.BUCKET.get(key);
}

export async function objectExists(env: Env, key: string) {
	const object = await env.BUCKET.head(key);
	return Boolean(object);
}

export async function putJsonObject(
	env: Env,
	key: string,
	payload: R2JsonPayload,
	metadata: R2CustomMetadataInput,
) {
	const jsonData = JSON.stringify(payload);
	return await env.BUCKET.put(key, jsonData, {
		httpMetadata: {
			contentType: "application/json",
		},
		customMetadata: toR2Metadata(metadata),
	});
}

export async function putAssetObject(env: Env, key: string, file: File) {
	return await env.BUCKET.put(key, file.stream(), {
		httpMetadata: {
			contentType: file.type,
		},
	});
}

export async function deleteObject(env: Env, key: string) {
	await env.BUCKET.delete(key);
}

export async function deleteObjects(env: Env, keys: string[]) {
	if (keys.length === 0) return;
	await Promise.allSettled(keys.map((key) => deleteObject(env, key)));
}
