export function getSignedOAuthQuery(search: string): string {
	const normalizedSearch = search.startsWith("?") ? search.slice(1) : search;
	if (!normalizedSearch) {
		return "";
	}

	const params = new URLSearchParams(normalizedSearch);
	if (!params.has("sig")) {
		return params.toString();
	}

	const signedParams = new URLSearchParams();
	for (const [key, value] of params.entries()) {
		signedParams.append(key, value);
		if (key === "sig") {
			break;
		}
	}

	return signedParams.toString();
}
