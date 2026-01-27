import { env, SELF } from "cloudflare:test";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../server/trpc/router";
import { createTestDb } from "./seed";

export function createTrpcClient() {
	return createTRPCClient<AppRouter>({
		links: [
			httpBatchLink({
				url: "http://localhost/api/trpc",
				fetch: (input, init) => SELF.fetch(input, init),
			}),
		],
	});
}

export function setupDb() {
	return createTestDb(env.DB);
}
