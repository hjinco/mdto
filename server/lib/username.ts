import reservedUsernames from "./reserved-usernames.json";

export const MAX_SUFFIX_SCAN = 10_000;

const reservedUsernameSet = new Set(
	reservedUsernames.map((username) => username.toLowerCase()),
);

export function isReservedUsername(name: string): boolean {
	return reservedUsernameSet.has(name.toLowerCase());
}

export function buildCandidate(base: string, scan: number): string {
	return scan === 0 ? base : `${base}${scan + 1}`;
}

export async function findAvailableUsername(
	base: string,
	isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
	for (let scan = 0; scan < MAX_SUFFIX_SCAN; scan++) {
		const candidate = buildCandidate(base, scan);
		if (isReservedUsername(candidate)) {
			continue;
		}

		if (!(await isTaken(candidate))) {
			return candidate;
		}
	}

	throw new Error(
		`Failed to generate unique user name after ${MAX_SUFFIX_SCAN} attempts`,
	);
}
