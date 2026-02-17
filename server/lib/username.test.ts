import { describe, expect, it } from "vitest";
import {
	buildCandidate,
	findAvailableUsername,
	isReservedUsername,
	MAX_SUFFIX_SCAN,
} from "./username";

describe("username helpers", () => {
	it("buildCandidate keeps base for first attempt and appends numeric suffix afterwards", () => {
		expect(buildCandidate("tester", 0)).toBe("tester");
		expect(buildCandidate("tester", 1)).toBe("tester2");
		expect(buildCandidate("tester", 2)).toBe("tester3");
	});

	it("findAvailableUsername chooses suffix when base is reserved", async () => {
		const result = await findAvailableUsername("admin", async () => false);
		expect(result).toBe("admin2");
	});

	it("findAvailableUsername skips reserved suffix candidates", async () => {
		const result = await findAvailableUsername("mail", async () => false);
		expect(result).toBe("mail6");
	});

	it("findAvailableUsername chooses next suffix when base is already taken", async () => {
		const result = await findAvailableUsername(
			"new_name",
			async (candidate) => candidate === "new_name",
		);
		expect(result).toBe("new_name2");
	});

	it("findAvailableUsername resolves mixed reserved and taken collisions", async () => {
		const result = await findAvailableUsername(
			"mail",
			async (candidate) => candidate === "mail6",
		);
		expect(result).toBe("mail7");
	});

	it("findAvailableUsername throws after max scans", async () => {
		await expect(
			findAvailableUsername("taken", async () => true),
		).rejects.toThrow(
			`Failed to generate unique user name after ${MAX_SUFFIX_SCAN} attempts`,
		);
	});

	it("isReservedUsername checks case-insensitively", () => {
		expect(isReservedUsername("Admin")).toBe(true);
		expect(isReservedUsername("unlikely_username_for_reserved_list")).toBe(
			false,
		);
	});
});
