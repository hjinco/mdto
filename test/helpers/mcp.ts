import { auth } from "../../server/lib/auth";
import { getMcpAuthIssuer, getMcpResourceUrl } from "../../server/mcp/auth";
import { MCP_PROTOCOL_VERSION } from "../../server/mcp/constants";
import { type WorkerFetchResult, workerFetch } from "./worker-http";

export type JsonRpcSuccess<T> = {
	jsonrpc: "2.0";
	id: string | number | null;
	result: T;
};

export type JsonRpcError = {
	jsonrpc: "2.0";
	id: string | number | null;
	error: {
		code: number;
		message: string;
		data?: unknown;
	};
};

type JsonRpcBody<T> = JsonRpcSuccess<T> | JsonRpcError;

export async function mcpFetch<T>(
	body: Record<string, unknown>,
	input?: {
		token?: string;
		protocolVersion?: string;
		origin?: string;
	},
): Promise<WorkerFetchResult<JsonRpcBody<T> | string>> {
	const headers = new Headers({
		accept: "application/json, text/event-stream",
		"content-type": "application/json",
	});

	if (input?.protocolVersion) {
		headers.set("mcp-protocol-version", input.protocolVersion);
	}

	if (input?.token) {
		headers.set("authorization", `Bearer ${input.token}`);
	}
	if (input?.origin) {
		headers.set("origin", input.origin);
	}

	return workerFetch<JsonRpcBody<T> | string>("http://localhost/mcp", {
		method: "POST",
		headers,
		body: JSON.stringify(body),
	});
}

export async function initializeMcp(
	token: string,
	input?: { origin?: string },
) {
	const response = await mcpFetch<{
		protocolVersion: string;
		serverInfo: {
			name: string;
			version: string;
		};
	}>(
		{
			jsonrpc: "2.0",
			id: "init-1",
			method: "initialize",
			params: {
				protocolVersion: MCP_PROTOCOL_VERSION,
				capabilities: {},
				clientInfo: {
					name: "vitest",
					version: "1.0.0",
				},
			},
		},
		{ token, origin: input?.origin },
	);

	if (!("result" in response.body)) {
		throw new Error("Failed to initialize MCP");
	}

	return response.body.result.protocolVersion;
}

export async function issueMcpAccessToken(input: {
	userId: string;
	sessionId: string;
	scopes?: string[];
	clientId?: string;
	expiresInSeconds?: number;
}) {
	const scopes = input.scopes ?? [
		"mdto:pages:read",
		"mdto:pages:write",
		"mdto:user:read",
		"mdto:user:write",
	];

	const result = await auth.api.signJWT({
		body: {
			payload: {
				sub: input.userId,
				sid: input.sessionId,
				azp: input.clientId ?? "mcp-test-client",
				aud: getMcpResourceUrl(),
				scope: scopes.join(" "),
			},
			overrideOptions: {
				jwt: {
					issuer: getMcpAuthIssuer(),
					expirationTime: input.expiresInSeconds
						? `${input.expiresInSeconds} seconds`
						: "1 hour",
				},
			},
		},
	});

	return result.token;
}
