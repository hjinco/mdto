import {
	oauthProviderAuthServerMetadata,
	oauthProviderOpenIdConfigMetadata,
} from "@better-auth/oauth-provider";
import { type Context, Hono } from "hono";
import { auth } from "../lib/auth";
import {
	authorizeMcpRequest,
	getProtectedResourceMetadata,
	type McpAuthApp,
} from "../mcp/auth";
import { MCP_PROTOCOL_VERSION } from "../mcp/constants";
import { createJsonResponseMcpTransport } from "../mcp/server";

export const mcpRouter = new Hono<McpAuthApp>();
const MCP_ALLOWED_METHODS = "POST, OPTIONS";
const MCP_ALLOWED_HEADERS = [
	"authorization",
	"content-type",
	"accept",
	"mcp-protocol-version",
].join(", ");
const MCP_EXPOSED_HEADERS = "mcp-protocol-version";
const PUBLIC_METADATA_ALLOWED_METHODS = "GET, OPTIONS";
const PUBLIC_METADATA_ALLOWED_HEADERS = ["accept", "mcp-protocol-version"].join(
	", ",
);

function setMcpCorsHeaders(c: Context<McpAuthApp>, origin?: string) {
	if (!origin) {
		return;
	}

	c.header("Access-Control-Allow-Origin", origin);
	c.header("Access-Control-Allow-Methods", MCP_ALLOWED_METHODS);
	c.header("Access-Control-Allow-Headers", MCP_ALLOWED_HEADERS);
	c.header("Access-Control-Expose-Headers", MCP_EXPOSED_HEADERS);
	c.header("Access-Control-Max-Age", "86400");
	c.header("Vary", "Origin");
}

function appendMcpCorsHeaders(response: Response, origin?: string) {
	if (!origin) {
		return response;
	}

	response.headers.set("Access-Control-Allow-Origin", origin);
	response.headers.set("Access-Control-Allow-Methods", MCP_ALLOWED_METHODS);
	response.headers.set("Access-Control-Allow-Headers", MCP_ALLOWED_HEADERS);
	response.headers.set("Access-Control-Expose-Headers", MCP_EXPOSED_HEADERS);
	response.headers.set("Access-Control-Max-Age", "86400");
	response.headers.set("Vary", "Origin");
	return response;
}

function setPublicMetadataCorsHeaders(c: Context<McpAuthApp>) {
	c.header("Access-Control-Allow-Origin", "*");
	c.header("Access-Control-Allow-Methods", PUBLIC_METADATA_ALLOWED_METHODS);
	c.header("Access-Control-Allow-Headers", PUBLIC_METADATA_ALLOWED_HEADERS);
	c.header("Access-Control-Max-Age", "86400");
}

function appendPublicMetadataCorsHeaders(response: Response) {
	response.headers.set("Access-Control-Allow-Origin", "*");
	response.headers.set(
		"Access-Control-Allow-Methods",
		PUBLIC_METADATA_ALLOWED_METHODS,
	);
	response.headers.set(
		"Access-Control-Allow-Headers",
		PUBLIC_METADATA_ALLOWED_HEADERS,
	);
	response.headers.set("Access-Control-Max-Age", "86400");
	return response;
}

mcpRouter.use("/.well-known/*", async (c, next) => {
	setPublicMetadataCorsHeaders(c);

	if (c.req.method === "OPTIONS") {
		return c.body(null, 204);
	}

	await next();
});

async function serveAuthServerMetadata(c: Context<McpAuthApp>) {
	const handler = oauthProviderAuthServerMetadata(auth);
	return appendPublicMetadataCorsHeaders(await handler(c.req.raw));
}

async function serveOpenIdConfigMetadata(c: Context<McpAuthApp>) {
	const handler = oauthProviderOpenIdConfigMetadata(auth);
	return appendPublicMetadataCorsHeaders(await handler(c.req.raw));
}

mcpRouter.get(
	"/.well-known/oauth-authorization-server",
	serveAuthServerMetadata,
);
mcpRouter.get(
	"/.well-known/oauth-authorization-server/api/auth",
	serveAuthServerMetadata,
);

mcpRouter.get("/.well-known/openid-configuration", serveOpenIdConfigMetadata);
mcpRouter.get(
	"/.well-known/openid-configuration/api/auth",
	serveOpenIdConfigMetadata,
);

mcpRouter.get("/.well-known/oauth-protected-resource", (c) => {
	return c.json(getProtectedResourceMetadata());
});

mcpRouter.get("/.well-known/oauth-protected-resource/mcp", (c) => {
	return c.json(getProtectedResourceMetadata());
});

mcpRouter.use("/mcp", async (c, next) => {
	const origin = c.req.header("origin");
	setMcpCorsHeaders(c, origin);

	if (c.req.method === "OPTIONS") {
		return c.body(null, 204);
	}

	if (c.req.method !== "POST") {
		return c.json(
			{
				jsonrpc: "2.0",
				error: {
					code: -32000,
					message:
						"Method not allowed. mdto MCP only supports POST JSON requests.",
				},
				id: null,
			},
			{
				status: 405,
				headers: {
					Allow: MCP_ALLOWED_METHODS,
				},
			},
		);
	}

	const authResponse = await authorizeMcpRequest(c);
	if (authResponse) {
		return appendMcpCorsHeaders(authResponse, origin);
	}

	await next();
});

mcpRouter.post("/mcp", async (c) => {
	c.header("mcp-protocol-version", MCP_PROTOCOL_VERSION);
	return createJsonResponseMcpTransport().handleRequest(c);
});
