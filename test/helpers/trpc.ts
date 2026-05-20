import { env, SELF } from "cloudflare:test";
import {
	createTRPCClient,
	httpBatchLink,
	httpLink,
	isNonJsonSerializable,
	splitLink,
} from "@trpc/client";
import type { AppRouter } from "../../server/trpc/router";
import { createTestDb } from "./seed";

export function createTrpcClient() {
	return createTRPCClient<AppRouter>({
		links: [
			splitLink({
				condition: (op) => isNonJsonSerializable(op.input),
				true: httpLink({
					url: "http://localhost/api/trpc",
					fetch: (input, init) => SELF.fetch(input, init),
				}),
				false: httpBatchLink({
					url: "http://localhost/api/trpc",
					fetch: (input, init) => SELF.fetch(input, init),
				}),
			}),
		],
	});
}

export function setupDb() {
	return createTestDb(env.DB);
}
