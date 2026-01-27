import type { db as dbType } from "../db/client";
import { getObject } from "../infra/r2";
import { createPageRepo } from "../repositories/page.repo";
import { createUserRepo } from "../repositories/user.repo";

type Db = typeof dbType;

type ViewMetadata = {
	theme: string;
	lang: string;
	title: string;
	description: string;
	hasKatex: boolean;
	hasMermaid: boolean;
};

type PublicViewResult =
	| { kind: "not_found" }
	| {
			kind: "ok";
			object: R2ObjectBody;
			html: string;
			markdown?: string;
			meta: ViewMetadata;
	  };

type UserViewResult =
	| { kind: "not_found" }
	| {
			kind: "ok";
			object: R2ObjectBody;
			html: string;
			markdown: string;
			lang: string;
			hasKatex: boolean;
			hasMermaid: boolean;
			page: {
				id: string;
				theme: string;
				title: string;
				description: string;
				expiresAt: Date | null;
			};
	  };

export function createViewService({ env, db }: { env: Env; db: Db }) {
	const userRepo = createUserRepo(db);
	const pageRepo = createPageRepo(db);

	return {
		async getPublicView(
			prefix: string,
			slug: string,
		): Promise<PublicViewResult> {
			const key = `${prefix}/${slug}`;
			const object = await getObject(env, key);
			if (!object) {
				return { kind: "not_found" };
			}

			const contentType = object.httpMetadata?.contentType || "text/html";
			let markdown: string | undefined;
			let html: string;

			if (contentType === "application/json") {
				const jsonData = await object.json<{
					html: string;
					markdown: string;
				}>();
				markdown = jsonData.markdown;
				html = jsonData.html;
			} else {
				markdown = undefined;
				html = await object.text();
			}

			const meta: ViewMetadata = {
				theme: object.customMetadata?.theme || "default",
				lang: object.customMetadata?.lang || "",
				title: object.customMetadata?.title || "",
				description: object.customMetadata?.description || "",
				hasKatex: object.customMetadata?.hasKatex === "1",
				hasMermaid: object.customMetadata?.hasMermaid === "1",
			};

			return { kind: "ok", object, html, markdown, meta };
		},

		async getUserView(username: string, slug: string): Promise<UserViewResult> {
			const user = await userRepo.findByName(username);
			if (!user) {
				return { kind: "not_found" };
			}

			const page = await pageRepo.findActiveByUserAndSlug(user.id, slug);
			if (!page) {
				return { kind: "not_found" };
			}

			const key = `u/${user.id}/${page.id}`;
			const object = await getObject(env, key);
			if (!object) {
				return { kind: "not_found" };
			}

			const jsonData = await object.json<{ html: string; markdown: string }>();

			return {
				kind: "ok",
				object,
				html: jsonData.html,
				markdown: jsonData.markdown,
				lang: object.customMetadata?.lang || "",
				hasKatex: object.customMetadata?.hasKatex === "1",
				hasMermaid: object.customMetadata?.hasMermaid === "1",
				page,
			};
		},
	};
}
