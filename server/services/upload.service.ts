import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import type { z } from "zod";
import type { db as dbType } from "../db/client";
import { objectExists, putJsonObject } from "../infra/r2";
import { getRemoteIp, validateTurnstile } from "../infra/turnstile";
import { isDev } from "../utils/env";
import { retryUntil } from "../utils/retry";
import { createManagedPageService } from "./managed-page.service";
import {
	type expirationDaysSchema,
	renderPageContent,
	type themeSchema,
} from "./page-content.service";

export { expirationDaysSchema, themeSchema } from "./page-content.service";

export type PublicCreateInput = {
	markdown: string;
	expirationDays: z.infer<typeof expirationDaysSchema>;
	theme: z.infer<typeof themeSchema>;
	turnstileToken: string | null;
};

export type UserCreateInput = {
	markdown: string;
	theme: z.infer<typeof themeSchema>;
	expiresAtMs: number | null;
};

type Db = typeof dbType;

type UploadServiceDeps = {
	env: Env;
	req: Request;
	db: Db;
};

export function createUploadService({ env, req, db }: UploadServiceDeps) {
	return {
		async publicCreate(input: PublicCreateInput) {
			const markdown = input.markdown;

			if (!isDev(env)) {
				const token = input.turnstileToken;
				if (!token) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Turnstile token is required",
					});
				}

				const remoteIp = getRemoteIp(req);
				const validation = await validateTurnstile(
					token,
					remoteIp,
					env.TURNSTILE_SECRET_KEY,
				);
				if (!validation.success) {
					const errorCodes = validation["error-codes"] || ["unknown-error"];
					console.error("Turnstile validation failed:", errorCodes);
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid verification. Please try again.",
					});
				}
			}

			const prefix = input.expirationDays.toString(16).toUpperCase();
			const { html, metadata } = await renderPageContent(markdown);

			const slug = await retryUntil(
				async () => nanoid(5),
				async (candidateSlug) => {
					const key = `${prefix}/${candidateSlug}`;
					return !(await objectExists(env, key));
				},
			);

			if (!slug) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to generate unique slug after maximum retries",
				});
			}

			const key = `${prefix}/${slug}`;
			await putJsonObject(
				env,
				key,
				{ markdown, html },
				{
					theme: input.theme,
					lang: metadata.lang || "",
					title: metadata.title || "",
					description: metadata.description || "",
					hasCodeBlock: metadata.hasCodeBlock,
					hasKatex: metadata.hasKatex,
					hasMermaid: metadata.hasMermaid,
					hasWikiLink: metadata.hasWikiLink,
				},
			);

			return { path: `${prefix}/${slug}` };
		},

		async userCreate(
			input: UserCreateInput,
			user: { id: string; name: string },
		) {
			const managedPageService = createManagedPageService({ env, db });
			const page = await managedPageService.createPage(
				{
					markdown: input.markdown,
					theme: input.theme,
					expiresAtMs: input.expiresAtMs,
				},
				user,
			);

			return { path: page.path.slice(1) };
		},
	};
}
