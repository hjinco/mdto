import "./helpers/mock-iso-language";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import * as schema from "../server/db/schema";
import { MCP_PROTOCOL_VERSION } from "../server/mcp/constants";
import { initializeMcp, issueMcpAccessToken, mcpFetch } from "./helpers/mcp";
import { buildPageMarkdown, getPageById } from "./helpers/page-api-fixtures";
import {
	seedOauthClient,
	seedPageForUser,
	seedSessionForUser,
	testUser,
} from "./helpers/seed";
import { workerFetch } from "./helpers/worker-http";
import { otherUser, registerWorkersTestHooks, testDb } from "./helpers/workers";

registerWorkersTestHooks();

async function issueTokenForUser(
	user: {
		id: string;
		name: string;
		email: string;
	},
	scopes?: string[],
) {
	const clientId = `mcp-client-${crypto.randomUUID()}`;
	const session = await seedSessionForUser(testDb, user, {
		id: `session_${user.id}_${crypto.randomUUID()}`,
	});
	await seedOauthClient(testDb, {
		clientId,
		userId: user.id,
	});

	const token = await issueMcpAccessToken({
		userId: user.id,
		sessionId: session.id,
		scopes,
		clientId,
	});

	return {
		token,
		sessionId: session.id,
		clientId,
	};
}

describe("remote MCP", () => {
	it("serves OAuth discovery and public auth endpoints with browser-readable CORS", async () => {
		const authMetadataResponse = await workerFetch<{
			issuer: string;
		}>("http://localhost/.well-known/oauth-authorization-server/api/auth", {
			headers: {
				origin: "https://client.example",
			},
		});

		expect(authMetadataResponse.status).toBe(200);
		expect(authMetadataResponse.body.issuer).toContain("/api/auth");
		expect(
			authMetadataResponse.response.headers.get("access-control-allow-origin"),
		).toBe("*");

		const jwksResponse = await workerFetch<{
			keys: unknown[];
		}>("http://localhost/api/auth/jwks", {
			headers: {
				origin: "https://client.example",
			},
		});

		expect(jwksResponse.status).toBe(200);
		expect(Array.isArray(jwksResponse.body.keys)).toBe(true);
		expect(
			jwksResponse.response.headers.get("access-control-allow-origin"),
		).toBe("*");

		const registerPreflightResponse = await workerFetch<null>(
			"http://localhost/api/auth/oauth2/register",
			{
				method: "OPTIONS",
				headers: {
					origin: "https://client.example",
					"access-control-request-method": "POST",
					"access-control-request-headers": "content-type",
				},
			},
		);

		expect(registerPreflightResponse.status).toBe(204);
		expect(
			registerPreflightResponse.response.headers.get(
				"access-control-allow-origin",
			),
		).toBe("*");
		expect(
			registerPreflightResponse.response.headers.get(
				"access-control-allow-methods",
			),
		).toBe("GET, POST, OPTIONS");
	});

	it("handles browser preflight requests for cross-origin MCP clients", async () => {
		const { response, status, body } = await workerFetch<null>(
			"http://localhost/mcp",
			{
				method: "OPTIONS",
				headers: {
					origin: "https://client.example",
					"access-control-request-method": "POST",
					"access-control-request-headers":
						"authorization, content-type, mcp-protocol-version",
				},
			},
		);

		expect(status).toBe(204);
		expect(body).toBeNull();
		expect(response.headers.get("access-control-allow-origin")).toBe(
			"https://client.example",
		);
		expect(response.headers.get("access-control-allow-methods")).toBe(
			"POST, OPTIONS",
		);
		expect(response.headers.get("access-control-allow-headers")).toContain(
			"authorization",
		);
		expect(response.headers.get("access-control-allow-headers")).not.toContain(
			"mcp-session-id",
		);
		expect(response.headers.get("access-control-allow-headers")).not.toContain(
			"last-event-id",
		);
		expect(response.headers.get("access-control-expose-headers")).toBe(
			"mcp-protocol-version",
		);
	});

	it("rejects GET to keep the MCP endpoint POST-only", async () => {
		const { token } = await issueTokenForUser(testUser);
		const { response, status, body } = await workerFetch<{
			jsonrpc: string;
			error: {
				code: number;
				message: string;
			};
			id: null;
		}>("http://localhost/mcp", {
			method: "GET",
			headers: {
				authorization: `Bearer ${token}`,
				accept: "application/json",
			},
		});

		expect(status).toBe(405);
		expect(response.headers.get("allow")).toBe("POST, OPTIONS");
		expect(body.error.message).toBe(
			"Method not allowed. mdto MCP only supports POST JSON requests.",
		);
	});

	it("rejects initialize without a bearer token", async () => {
		const { response, status, body } = await mcpFetch(
			{
				jsonrpc: "2.0",
				id: "init-missing-token",
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
			{},
		);

		expect(status).toBe(401);
		expect(body).toBe("Missing bearer token");
		expect(response.headers.get("www-authenticate")).toContain(
			"/.well-known/oauth-protected-resource/mcp",
		);
	});

	it("allows initialize from a different browser origin after OAuth", async () => {
		const { token } = await issueTokenForUser(testUser);
		const protocolVersion = await initializeMcp(token, {
			origin: "https://client.example",
		});

		expect(protocolVersion).toBe(MCP_PROTOCOL_VERSION);
	});

	it("negotiates older supported protocol versions during initialize", async () => {
		const { token } = await issueTokenForUser(testUser);
		const { status, body } = await mcpFetch<{
			protocolVersion: string;
		}>(
			{
				jsonrpc: "2.0",
				id: "init-older-version",
				method: "initialize",
				params: {
					protocolVersion: "2025-06-18",
					capabilities: {},
					clientInfo: {
						name: "vitest",
						version: "1.0.0",
					},
				},
			},
			{ token },
		);

		expect(status).toBe(200);
		if (!("result" in body)) {
			throw new Error("Expected initialize result");
		}

		expect(body.result.protocolVersion).toBe("2025-06-18");
	});

	it("rejects initialize with an invalid token", async () => {
		const { status, body } = await mcpFetch(
			{
				jsonrpc: "2.0",
				id: "init-invalid-token",
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
			{ token: "bad-token" },
		);

		expect(status).toBe(401);
		expect(body).toBe("Invalid access token");
	});

	it("rejects initialize when the OAuth client is disabled", async () => {
		const clientId = `mcp-client-${crypto.randomUUID()}`;
		const session = await seedSessionForUser(testDb, testUser, {
			id: `session_${testUser.id}_${crypto.randomUUID()}`,
		});
		await seedOauthClient(testDb, {
			clientId,
			userId: testUser.id,
			disabled: true,
		});

		const token = await issueMcpAccessToken({
			userId: testUser.id,
			sessionId: session.id,
			clientId,
		});

		const { status, body } = await mcpFetch(
			{
				jsonrpc: "2.0",
				id: "init-disabled-client",
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
			{ token },
		);

		expect(status).toBe(401);
		expect(body).toBe("Invalid access token");
	});

	it("lists the v1 tools after initialize", async () => {
		const { token } = await issueTokenForUser(testUser);
		const protocolVersion = await initializeMcp(token);

		const { status, body } = await mcpFetch<{
			tools: Array<{ name: string }>;
		}>(
			{
				jsonrpc: "2.0",
				id: "tools-list",
				method: "tools/list",
				params: {},
			},
			{
				token,
				protocolVersion,
			},
		);

		expect(status).toBe(200);
		if (!("result" in body)) {
			throw new Error("Expected tools/list result");
		}

		expect(body.result.tools.map((tool) => tool.name)).toEqual([
			"list_pages",
			"create_page",
			"update_page",
			"delete_page",
			"change_slug",
			"get_dashboard_visibility",
			"set_dashboard_visibility",
		]);
	});

	it("supports create, list, update, change slug, and delete for the same user", async () => {
		const { token } = await issueTokenForUser(testUser);
		const protocolVersion = await initializeMcp(token);
		const markdown = buildPageMarkdown({
			title: "MCP Title",
			description: "Created from MCP",
		});

		const createResponse = await mcpFetch<{
			content: Array<{ text: string }>;
			structuredContent: {
				id: string;
				slug: string;
				path: string;
				title: string;
			};
		}>(
			{
				jsonrpc: "2.0",
				id: "create-page",
				method: "tools/call",
				params: {
					name: "create_page",
					arguments: {
						markdown,
						slug: "mcp-page",
						theme: "default",
						expiresAtMs: null,
					},
				},
			},
			{ token, protocolVersion },
		);

		expect(createResponse.status).toBe(200);
		if (!("result" in createResponse.body)) {
			throw new Error("Expected create_page result");
		}

		expect(createResponse.body.result.isError).toBeUndefined();
		const createdPage = createResponse.body.result.structuredContent;
		expect(createdPage.slug).toBe("mcp-page");

		const listResponse = await mcpFetch<{
			structuredContent: Array<{ id: string; slug: string }>;
		}>(
			{
				jsonrpc: "2.0",
				id: "list-pages",
				method: "tools/call",
				params: {
					name: "list_pages",
					arguments: {},
				},
			},
			{ token, protocolVersion },
		);

		if (!("result" in listResponse.body)) {
			throw new Error("Expected list_pages result");
		}

		expect(listResponse.body.result.structuredContent).toEqual([
			expect.objectContaining({
				id: createdPage.id,
				slug: "mcp-page",
			}),
		]);

		const updateResponse = await mcpFetch<{
			structuredContent: {
				id: string;
				slug: string;
				title: string;
			};
		}>(
			{
				jsonrpc: "2.0",
				id: "update-page",
				method: "tools/call",
				params: {
					name: "update_page",
					arguments: {
						pageId: createdPage.id,
						markdown: buildPageMarkdown({
							title: "Updated Title",
							description: "Updated from MCP",
						}),
						newSlug: "mcp-page-updated",
						theme: "matrix",
					},
				},
			},
			{ token, protocolVersion },
		);

		if (!("result" in updateResponse.body)) {
			throw new Error("Expected update_page result");
		}

		expect(updateResponse.body.result.structuredContent.slug).toBe(
			"mcp-page-updated",
		);
		expect(updateResponse.body.result.structuredContent.title).toBe(
			"Updated Title",
		);

		const changeSlugResponse = await mcpFetch<{
			structuredContent: {
				ok: true;
				slug: string;
				previousSlug: string;
			};
		}>(
			{
				jsonrpc: "2.0",
				id: "change-slug",
				method: "tools/call",
				params: {
					name: "change_slug",
					arguments: {
						pageId: createdPage.id,
						slug: "mcp-page-final",
					},
				},
			},
			{ token, protocolVersion },
		);

		if (!("result" in changeSlugResponse.body)) {
			throw new Error("Expected change_slug result");
		}

		expect(changeSlugResponse.body.result.structuredContent).toMatchObject({
			ok: true,
			slug: "mcp-page-final",
			previousSlug: "mcp-page-updated",
		});

		const deleteResponse = await mcpFetch<{
			structuredContent: {
				ok: true;
				slug: string;
			};
		}>(
			{
				jsonrpc: "2.0",
				id: "delete-page",
				method: "tools/call",
				params: {
					name: "delete_page",
					arguments: {
						pageId: createdPage.id,
					},
				},
			},
			{ token, protocolVersion },
		);

		if (!("result" in deleteResponse.body)) {
			throw new Error("Expected delete_page result");
		}

		expect(deleteResponse.body.result.structuredContent).toEqual({
			ok: true,
			slug: "mcp-page-final",
		});

		const deletedPage = await getPageById(createdPage.id);
		expect(deletedPage?.deletedAt).not.toBeNull();
	});

	it("returns a tool error when trying to mutate another user's page", async () => {
		await seedPageForUser(testDb, {
			id: "other-mcp-page",
			userId: otherUser.id,
			slug: "other-mcp-slug",
		});
		const { token } = await issueTokenForUser(testUser);
		const protocolVersion = await initializeMcp(token);

		const { status, body } = await mcpFetch<{
			isError: boolean;
			content: Array<{ text: string }>;
		}>(
			{
				jsonrpc: "2.0",
				id: "delete-other-page",
				method: "tools/call",
				params: {
					name: "delete_page",
					arguments: {
						pageId: "other-mcp-page",
					},
				},
			},
			{ token, protocolVersion },
		);

		expect(status).toBe(200);
		if (!("result" in body)) {
			throw new Error("Expected delete_page tool result");
		}

		expect(body.result.isError).toBe(true);
		expect(body.result.content[0]?.text).toBe("Forbidden");
	});

	it("returns a tool error when the token lacks the required scope", async () => {
		const { token } = await issueTokenForUser(testUser, ["mdto:pages:read"]);
		const protocolVersion = await initializeMcp(token);

		const { body } = await mcpFetch<{
			isError: boolean;
			content: Array<{ text: string }>;
		}>(
			{
				jsonrpc: "2.0",
				id: "set-dashboard-visibility-without-scope",
				method: "tools/call",
				params: {
					name: "set_dashboard_visibility",
					arguments: {
						isDashboardPublic: true,
					},
				},
			},
			{ token, protocolVersion },
		);

		if (!("result" in body)) {
			throw new Error("Expected set_dashboard_visibility result");
		}

		expect(body.result.isError).toBe(true);
		expect(body.result.content[0]?.text).toContain("Missing required scope");
	});

	it("responds to ping after initialize", async () => {
		const { token } = await issueTokenForUser(testUser);
		const protocolVersion = await initializeMcp(token);

		const { status, body } = await mcpFetch<Record<string, never>>(
			{
				jsonrpc: "2.0",
				id: "ping-1",
				method: "ping",
			},
			{ token, protocolVersion },
		);

		expect(status).toBe(200);
		if (!("result" in body)) {
			throw new Error("Expected ping result");
		}

		expect(body.result).toEqual({});
	});

	it("preserves the request id for unsupported methods", async () => {
		const { token } = await issueTokenForUser(testUser);
		const protocolVersion = await initializeMcp(token);

		const { status, body } = await mcpFetch(
			{
				jsonrpc: "2.0",
				id: "resources-list-1",
				method: "resources/list",
				params: {},
			},
			{ token, protocolVersion },
		);

		expect(status).toBe(200);
		if (!("error" in body)) {
			throw new Error("Expected unsupported method error");
		}

		expect(body.id).toBe("resources-list-1");
		expect(body.error.message).toContain("Method not found");
	});

	it("reads and updates dashboard visibility", async () => {
		await testDb
			.update(schema.user)
			.set({ isDashboardPublic: false })
			.where(eq(schema.user.id, testUser.id));
		const { token } = await issueTokenForUser(testUser);
		const protocolVersion = await initializeMcp(token);

		const getVisibilityResponse = await mcpFetch<{
			structuredContent: {
				isDashboardPublic: boolean;
			};
		}>(
			{
				jsonrpc: "2.0",
				id: "get-dashboard-visibility",
				method: "tools/call",
				params: {
					name: "get_dashboard_visibility",
					arguments: {},
				},
			},
			{ token, protocolVersion },
		);

		if (!("result" in getVisibilityResponse.body)) {
			throw new Error("Expected get_dashboard_visibility result");
		}

		expect(
			getVisibilityResponse.body.result.structuredContent.isDashboardPublic,
		).toBe(false);

		const setVisibilityResponse = await mcpFetch<{
			structuredContent: {
				ok: true;
				isDashboardPublic: boolean;
			};
		}>(
			{
				jsonrpc: "2.0",
				id: "set-dashboard-visibility",
				method: "tools/call",
				params: {
					name: "set_dashboard_visibility",
					arguments: {
						isDashboardPublic: true,
					},
				},
			},
			{ token, protocolVersion },
		);

		if (!("result" in setVisibilityResponse.body)) {
			throw new Error("Expected set_dashboard_visibility result");
		}

		expect(setVisibilityResponse.body.result.structuredContent).toEqual({
			ok: true,
			isDashboardPublic: true,
		});

		const [updatedUser] = await testDb
			.select({
				isDashboardPublic: schema.user.isDashboardPublic,
			})
			.from(schema.user)
			.where(eq(schema.user.id, testUser.id))
			.limit(1)
			.all();

		expect(updatedUser?.isDashboardPublic).toBe(true);
	});

	it("serves OAuth discovery metadata at the worker root", async () => {
		const authorizationServerResponse = await workerFetch<{
			issuer: string;
			token_endpoint: string;
		}>("http://localhost/.well-known/oauth-authorization-server");
		expect(authorizationServerResponse.status).toBe(200);
		expect(authorizationServerResponse.body.issuer).toContain("/api/auth");
		expect(authorizationServerResponse.body.token_endpoint).toContain(
			"/api/auth/oauth2/token",
		);

		const protectedResourceResponse = await workerFetch<{
			resource: string;
			authorization_servers: string[];
		}>("http://localhost/.well-known/oauth-protected-resource/mcp");
		expect(protectedResourceResponse.status).toBe(200);
		expect(protectedResourceResponse.body.resource).toContain("/mcp");
		expect(protectedResourceResponse.body.authorization_servers[0]).toContain(
			"/api/auth",
		);
	});
});
