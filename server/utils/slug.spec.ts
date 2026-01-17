import { describe, expect, it } from "vitest";
import { generateSlug, isValidSlug } from "./slug";

describe("slug utilities", () => {
	describe("isValidSlug", () => {
		it("should return true for valid 5-character slugs with alphanumeric characters", () => {
			expect(isValidSlug("abc12")).toBe(true);
			expect(isValidSlug("ABCDE")).toBe(true);
			expect(isValidSlug("12345")).toBe(true);
			expect(isValidSlug("a1B2c")).toBe(true);
		});

		it("should return true for valid 5-character slugs with underscore", () => {
			expect(isValidSlug("abc_1")).toBe(true);
			expect(isValidSlug("_test")).toBe(true);
			expect(isValidSlug("test_")).toBe(true);
			expect(isValidSlug("a_b_c")).toBe(true);
		});

		it("should return true for valid 5-character slugs with hyphen", () => {
			expect(isValidSlug("abc-1")).toBe(true);
			expect(isValidSlug("-test")).toBe(true);
			expect(isValidSlug("test-")).toBe(true);
			expect(isValidSlug("a-b-c")).toBe(true);
		});

		it("should return true for valid 5-character slugs with both underscore and hyphen", () => {
			expect(isValidSlug("a-b_c")).toBe(true);
			expect(isValidSlug("_a-b-")).toBe(true);
			expect(isValidSlug("a_b-c")).toBe(true);
		});

		it("should return false for slugs shorter than 5 characters", () => {
			expect(isValidSlug("")).toBe(false);
			expect(isValidSlug("a")).toBe(false);
			expect(isValidSlug("ab")).toBe(false);
			expect(isValidSlug("abc")).toBe(false);
			expect(isValidSlug("abcd")).toBe(false);
		});

		it("should return false for slugs longer than 5 characters", () => {
			expect(isValidSlug("abcdef")).toBe(false);
			expect(isValidSlug("abc123")).toBe(false);
			expect(isValidSlug("verylongslug")).toBe(false);
		});

		it("should return false for slugs with invalid characters", () => {
			expect(isValidSlug("abc@1")).toBe(false);
			expect(isValidSlug("abc.1")).toBe(false);
			expect(isValidSlug("abc 1")).toBe(false);
			expect(isValidSlug("abc+1")).toBe(false);
			expect(isValidSlug("abc#1")).toBe(false);
			expect(isValidSlug("한글12")).toBe(false);
		});

		it("should return false for null or undefined", () => {
			expect(isValidSlug(null as unknown as string)).toBe(false);
			expect(isValidSlug(undefined as unknown as string)).toBe(false);
		});
	});

	describe("generateSlug", () => {
		it("should generate a valid slug", () => {
			const slug = generateSlug();
			expect(isValidSlug(slug)).toBe(true);
		});

		it("should generate slugs of exactly 5 characters", () => {
			const slug = generateSlug();
			expect(slug.length).toBe(5);
		});
	});
});
