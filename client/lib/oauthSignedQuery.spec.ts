import { describe, expect, it } from "vitest";
import { getSignedOAuthQuery } from "./oauthSignedQuery";

describe("getSignedOAuthQuery", () => {
	it("returns the full query when no signature is present", () => {
		expect(getSignedOAuthQuery("?client_id=test&scope=openid")).toBe(
			"client_id=test&scope=openid",
		);
	});

	it("keeps only the signed portion of the query", () => {
		expect(
			getSignedOAuthQuery(
				"?client_id=test&scope=openid&exp=123&sig=abc123&utm_source=newsletter",
			),
		).toBe("client_id=test&scope=openid&exp=123&sig=abc123");
	});

	it("returns an empty string for an empty search string", () => {
		expect(getSignedOAuthQuery("")).toBe("");
		expect(getSignedOAuthQuery("?")).toBe("");
	});
});
