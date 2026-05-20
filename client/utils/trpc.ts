import { QueryClient } from "@tanstack/react-query";
import {
	createTRPCClient,
	httpBatchLink,
	httpLink,
	isNonJsonSerializable,
	splitLink,
} from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "../../server/trpc/router";

export const queryClient = new QueryClient();

const trpcClient = createTRPCClient<AppRouter>({
	links: [
		splitLink({
			condition: (op) => isNonJsonSerializable(op.input),
			true: httpLink({
				url: "/api/trpc",
				fetch: (input, init) =>
					fetch(input, { ...init, credentials: "include" }),
			}),
			false: httpBatchLink({
				url: "/api/trpc",
				fetch: (input, init) =>
					fetch(input, { ...init, credentials: "include" }),
			}),
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});
