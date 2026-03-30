import { env } from "cloudflare:workers";
import { StreamableHTTPTransport } from "@hono/mcp";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import {
	ErrorCode,
	isInitializeRequest,
	isJSONRPCRequest,
	type JSONRPCError,
	type JSONRPCMessage,
	type JSONRPCRequest,
	type JSONRPCResponse,
	LATEST_PROTOCOL_VERSION,
	type ServerNotification,
	type ServerRequest,
	SUPPORTED_PROTOCOL_VERSIONS,
} from "@modelcontextprotocol/sdk/types.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "../db/client";
import { createManagedPageService } from "../services/managed-page.service";
import { pageSlugSchema, themeSchema } from "../services/page-content.service";
import { createUserService } from "../services/user.service";
import { getViewCachePaths, purgePathsFromCache } from "../utils/cache";
import {
	getPrincipalFromAuthInfo,
	hasRequiredScope,
	MCP_PAGE_READ_SCOPE,
	MCP_PAGE_WRITE_SCOPE,
	MCP_USER_READ_SCOPE,
	MCP_USER_WRITE_SCOPE,
} from "./auth";

type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

type JsonSchema = Record<string, unknown>;
type JsonRpcResult = Record<string, unknown>;

type ToolDefinition = {
	name: string;
	description: string;
	inputSchema: JsonSchema;
	handler: (args: unknown, extra: ToolExtra) => Promise<JsonRpcResult>;
};

const publicBaseUrl = env.BETTER_AUTH_URL;
const serverInfo = {
	name: "mdto",
	version: "0.0.0",
} as const;

function emptyObjectSchema(): JsonSchema {
	return {
		type: "object",
		properties: {},
		additionalProperties: false,
	};
}

function toJsonSchema(schema: z.ZodTypeAny | null): JsonSchema {
	if (!schema) {
		return emptyObjectSchema();
	}

	return z.toJSONSchema(schema);
}

function jsonToolResult(data: unknown): JsonRpcResult {
	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(data, null, 2),
			},
		],
		structuredContent: data,
	};
}

function toolErrorResult(error: unknown) {
	if (error instanceof TRPCError) {
		return {
			isError: true,
			content: [
				{
					type: "text" as const,
					text: error.message,
				},
			],
			structuredContent: {
				code: error.code,
				message: error.message,
			},
		};
	}

	const message =
		error instanceof Error ? error.message : "Internal server error";
	return {
		isError: true,
		content: [
			{
				type: "text" as const,
				text: message,
			},
		],
		structuredContent: {
			code: "INTERNAL_SERVER_ERROR",
			message,
		},
	};
}

function requirePrincipal(extra: ToolExtra) {
	return getPrincipalFromAuthInfo(extra.authInfo);
}

function requireScope(extra: ToolExtra, scope: string) {
	if (!hasRequiredScope(extra.authInfo, scope)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: `Missing required scope: ${scope}`,
		});
	}
}

function createToolHandler<TSchema extends z.ZodTypeAny | null>(
	schema: TSchema,
	handler: (
		args: TSchema extends z.ZodTypeAny ? z.infer<TSchema> : undefined,
		extra: ToolExtra,
	) => Promise<unknown>,
) {
	return async (args: unknown, extra: ToolExtra) => {
		try {
			const parsedArgs = schema ? schema.parse(args ?? {}) : undefined;
			return jsonToolResult(
				await handler(
					parsedArgs as TSchema extends z.ZodTypeAny
						? z.infer<TSchema>
						: undefined,
					extra,
				),
			);
		} catch (error) {
			return toolErrorResult(error);
		}
	};
}

const managedPageService = createManagedPageService({ env, db });
const userService = createUserService({ db });

const createPageSchema = z.object({
	markdown: z.string(),
	slug: pageSlugSchema.optional(),
	theme: themeSchema.default("default"),
	expiresAtMs: z.number().nullable().default(null),
});

const updatePageSchema = z.object({
	pageId: z.string().min(1),
	markdown: z.string(),
	newSlug: pageSlugSchema.optional(),
	theme: themeSchema.optional(),
	expiresAtMs: z.number().nullable().optional(),
});

const deletePageSchema = z.object({
	pageId: z.string().min(1),
});

const changeSlugSchema = z.object({
	pageId: z.string().min(1),
	slug: pageSlugSchema,
});

const setDashboardVisibilitySchema = z.object({
	isDashboardPublic: z.boolean(),
});

const tools = [
	{
		name: "list_pages",
		description: "List managed pages for the authenticated mdto user.",
		inputSchema: emptyObjectSchema(),
		handler: createToolHandler(null, async (_args, extra) => {
			requireScope(extra, MCP_PAGE_READ_SCOPE);
			const { user } = requirePrincipal(extra);
			return managedPageService.listForUser(user);
		}),
	},
	{
		name: "create_page",
		description: "Create a managed mdto page from markdown.",
		inputSchema: toJsonSchema(createPageSchema),
		handler: createToolHandler(createPageSchema, async (args, extra) => {
			requireScope(extra, MCP_PAGE_WRITE_SCOPE);
			const { user } = requirePrincipal(extra);
			return managedPageService.createPage(args, user);
		}),
	},
	{
		name: "update_page",
		description:
			"Update markdown, slug, theme, or expiration for a managed page.",
		inputSchema: toJsonSchema(updatePageSchema),
		handler: createToolHandler(updatePageSchema, async (args, extra) => {
			requireScope(extra, MCP_PAGE_WRITE_SCOPE);
			const { user } = requirePrincipal(extra);
			const result = await managedPageService.updatePage(args, user);
			await purgePathsFromCache(publicBaseUrl, [
				...getViewCachePaths(`/${user.name}/${result.previousSlug}`),
				...getViewCachePaths(result.page.path),
			]);
			return result.page;
		}),
	},
	{
		name: "delete_page",
		description: "Delete a managed mdto page.",
		inputSchema: toJsonSchema(deletePageSchema),
		handler: createToolHandler(deletePageSchema, async (args, extra) => {
			requireScope(extra, MCP_PAGE_WRITE_SCOPE);
			const { user } = requirePrincipal(extra);
			const result = await managedPageService.deletePage(user.id, args.pageId);
			await purgePathsFromCache(publicBaseUrl, [
				...getViewCachePaths(`/${user.name}/${result.slug}`),
			]);
			return result;
		}),
	},
	{
		name: "change_slug",
		description: "Change the slug of an existing managed mdto page.",
		inputSchema: toJsonSchema(changeSlugSchema),
		handler: createToolHandler(changeSlugSchema, async (args, extra) => {
			requireScope(extra, MCP_PAGE_WRITE_SCOPE);
			const { user } = requirePrincipal(extra);
			const result = await managedPageService.changeSlug(
				user,
				args.pageId,
				args.slug,
			);
			await purgePathsFromCache(publicBaseUrl, [
				...getViewCachePaths(`/${user.name}/${result.previousSlug}`),
				...getViewCachePaths(result.path),
			]);
			return result;
		}),
	},
	{
		name: "get_dashboard_visibility",
		description: "Read whether the authenticated user's dashboard is public.",
		inputSchema: emptyObjectSchema(),
		handler: createToolHandler(null, async (_args, extra) => {
			requireScope(extra, MCP_USER_READ_SCOPE);
			const { user } = requirePrincipal(extra);
			return userService.getDashboardVisibility(user.id);
		}),
	},
	{
		name: "set_dashboard_visibility",
		description: "Set whether the authenticated user's dashboard is public.",
		inputSchema: toJsonSchema(setDashboardVisibilitySchema),
		handler: createToolHandler(
			setDashboardVisibilitySchema,
			async (args, extra) => {
				requireScope(extra, MCP_USER_WRITE_SCOPE);
				const { user } = requirePrincipal(extra);
				return userService.setDashboardVisibility(
					user.id,
					args.isDashboardPublic,
				);
			},
		),
	},
] satisfies ToolDefinition[];

const toolsByName = new Map(tools.map((tool) => [tool.name, tool]));

function jsonRpcError(
	id: JSONRPCRequest["id"] | undefined,
	code: number,
	message: string,
	data?: unknown,
) {
	return {
		jsonrpc: "2.0",
		id,
		error: {
			code,
			message,
			...(data === undefined ? {} : { data }),
		},
	} satisfies JSONRPCError;
}

function jsonRpcResult(id: JSONRPCRequest["id"], result: JsonRpcResult) {
	return {
		jsonrpc: "2.0",
		id,
		result,
	} satisfies JSONRPCResponse;
}

function negotiateProtocolVersion(requestedVersion: unknown) {
	return typeof requestedVersion === "string" &&
		SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion)
		? requestedVersion
		: LATEST_PROTOCOL_VERSION;
}

async function handleInitialize(
	message: JSONRPCRequest,
): Promise<JSONRPCResponse | JSONRPCError> {
	return jsonRpcResult(message.id, {
		protocolVersion: negotiateProtocolVersion(
			typeof message.params === "object" && message.params
				? message.params.protocolVersion
				: undefined,
		),
		capabilities: {
			tools: {
				listChanged: false,
			},
		},
		serverInfo,
	});
}

async function handlePing(
	message: JSONRPCRequest,
): Promise<JSONRPCResponse | JSONRPCError> {
	return jsonRpcResult(message.id, {});
}

async function handleToolsList(
	message: JSONRPCRequest,
): Promise<JSONRPCResponse | JSONRPCError> {
	return jsonRpcResult(message.id, {
		tools: tools.map((tool) => ({
			name: tool.name,
			description: tool.description,
			inputSchema: tool.inputSchema,
		})),
	});
}

async function handleToolsCall(
	message: JSONRPCRequest,
	extra: ToolExtra,
): Promise<JSONRPCResponse | JSONRPCError> {
	const params = message.params;
	if (
		!params ||
		typeof params !== "object" ||
		typeof params.name !== "string"
	) {
		return jsonRpcError(
			message.id,
			ErrorCode.InvalidParams,
			"Invalid tool call",
		);
	}

	const tool = toolsByName.get(params.name);
	if (!tool) {
		return jsonRpcError(
			message.id,
			ErrorCode.InvalidParams,
			`Tool ${params.name} not found`,
		);
	}

	const result = await tool.handler(
		"arguments" in params ? params.arguments : undefined,
		extra,
	);
	return jsonRpcResult(message.id, result);
}

async function dispatchMessage(
	message: JSONRPCMessage,
	extra: ToolExtra,
): Promise<JSONRPCResponse | JSONRPCError | null> {
	if (!isJSONRPCRequest(message)) {
		return null;
	}

	if (isInitializeRequest(message)) {
		return handleInitialize(message);
	}

	switch (message.method) {
		case "ping":
			return handlePing(message);
		case "tools/list":
			return handleToolsList(message);
		case "tools/call":
			return handleToolsCall(message, extra);
		case "notifications/initialized":
			return null;
		default:
			return jsonRpcError(
				message.id,
				ErrorCode.MethodNotFound,
				`Method not found: ${message.method}`,
			);
	}
}

export function createJsonResponseMcpTransport() {
	const transport = new StreamableHTTPTransport({
		// mdto currently exposes MCP as a stateless POST -> JSON endpoint.
		// We intentionally avoid session-backed streaming semantics here.
		sessionIdGenerator: undefined,
		enableJsonResponse: true,
	});

	transport.onmessage = async (message, extra) => {
		const result = await dispatchMessage(message, extra as ToolExtra);
		if (!result || !isJSONRPCRequest(message)) {
			return;
		}

		await transport.send(result, {
			relatedRequestId: message.id,
		});
	};

	return transport;
}
