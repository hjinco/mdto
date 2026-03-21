import { env } from "cloudflare:workers";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { verifyJwsAccessToken } from "better-auth/oauth2";
import { and, eq, gt } from "drizzle-orm";
import type { Context } from "hono";
import { db } from "../db/client";
import * as schema from "../db/schema";
import { auth } from "../lib/auth";
import { createUserRepo } from "../repositories/user.repo";
import {
	MCP_PAGE_READ_SCOPE,
	MCP_PAGE_WRITE_SCOPE,
	MCP_SCOPES,
	MCP_USER_READ_SCOPE,
	MCP_USER_WRITE_SCOPE,
} from "./constants";

type McpAuthApp = {
	Bindings: Env;
	Variables: {
		auth: AuthInfo;
	};
};

type McpPrincipal = {
	user: {
		id: string;
		name: string;
	};
	clientId: string;
	sessionId: string;
	scopes: string[];
};

type McpAuthExtraUser = {
	id: string;
	name: string;
};

const authOrigin = new URL(env.BETTER_AUTH_URL).origin;
const authIssuer = `${authOrigin}/api/auth`;
const mcpResourceUrl = `${authOrigin}/mcp`;
const protectedResourcePath = "/.well-known/oauth-protected-resource/mcp";

function createUnauthorizedResponse(message: string) {
	return new Response(message, {
		status: 401,
		headers: {
			"WWW-Authenticate": `Bearer resource_metadata="${authOrigin}${protectedResourcePath}"`,
		},
	});
}

export function getMcpResourceUrl() {
	return mcpResourceUrl;
}

export function getMcpAuthIssuer() {
	return authIssuer;
}

export function getProtectedResourceMetadata() {
	return {
		resource: mcpResourceUrl,
		authorization_servers: [authIssuer],
		jwks_uri: `${authIssuer}/jwks`,
		scopes_supported: [...MCP_SCOPES],
		bearer_methods_supported: ["header"],
	};
}

export function hasRequiredScope(
	authInfo: AuthInfo | undefined,
	requiredScope: string,
) {
	return authInfo?.scopes.includes(requiredScope) ?? false;
}

function isMcpAuthExtraUser(value: unknown): value is McpAuthExtraUser {
	if (!value || typeof value !== "object") {
		return false;
	}

	const candidate = value as Record<string, unknown>;
	return typeof candidate.id === "string" && typeof candidate.name === "string";
}

export function getPrincipalFromAuthInfo(authInfo: AuthInfo | undefined) {
	const extra = authInfo?.extra;
	if (!extra) {
		throw new Error("Missing MCP auth context");
	}

	const user = extra.user;
	if (!isMcpAuthExtraUser(user)) {
		throw new Error("Missing authenticated user");
	}

	const sessionId = extra.sessionId;
	if (typeof sessionId !== "string" || sessionId.length === 0) {
		throw new Error("Missing authenticated session");
	}

	const clientId = extra.clientId;
	if (typeof clientId !== "string" || clientId.length === 0) {
		throw new Error("Missing OAuth client");
	}

	return {
		user: {
			id: user.id,
			name: user.name,
		},
		sessionId,
		clientId,
		scopes: authInfo?.scopes ?? [],
	} satisfies McpPrincipal;
}

export async function authorizeMcpRequest(c: Context<McpAuthApp>) {
	const authorization = c.req.header("authorization");
	const token = authorization?.startsWith("Bearer ")
		? authorization.slice("Bearer ".length)
		: undefined;

	if (!token) {
		return createUnauthorizedResponse("Missing bearer token");
	}

	try {
		const jwtPayload = await verifyJwsAccessToken(token, {
			jwksFetch: async () => auth.api.getJwks(),
			verifyOptions: {
				issuer: authIssuer,
				audience: mcpResourceUrl,
			},
		});

		const userId = typeof jwtPayload.sub === "string" ? jwtPayload.sub : null;
		const clientId =
			typeof jwtPayload.client_id === "string"
				? jwtPayload.client_id
				: typeof jwtPayload.azp === "string"
					? jwtPayload.azp
					: null;
		const sessionId =
			typeof jwtPayload.sid === "string" ? jwtPayload.sid : null;
		const scopeClaim =
			typeof jwtPayload.scope === "string" ? jwtPayload.scope : "";

		if (!userId || !clientId || !sessionId) {
			return createUnauthorizedResponse("Invalid access token");
		}

		const [oauthClient] = await db
			.select({
				clientId: schema.oauthClient.clientId,
				disabled: schema.oauthClient.disabled,
			})
			.from(schema.oauthClient)
			.where(eq(schema.oauthClient.clientId, clientId))
			.limit(1)
			.all();

		if (!oauthClient || oauthClient.disabled) {
			return createUnauthorizedResponse("Invalid access token");
		}

		const [activeSession] = await db
			.select({
				id: schema.session.id,
				userId: schema.session.userId,
			})
			.from(schema.session)
			.where(
				and(
					eq(schema.session.id, sessionId),
					eq(schema.session.userId, userId),
					gt(schema.session.expiresAt, new Date()),
				),
			)
			.limit(1)
			.all();

		if (!activeSession) {
			return createUnauthorizedResponse("Session expired");
		}

		const userRepo = createUserRepo(db);
		const user = await userRepo.findById(userId);
		if (!user) {
			return createUnauthorizedResponse("User not found");
		}

		c.set("auth", {
			token,
			clientId,
			scopes: scopeClaim.split(" ").filter(Boolean),
			expiresAt:
				typeof jwtPayload.exp === "number" ? jwtPayload.exp : undefined,
			resource: new URL(mcpResourceUrl),
			extra: {
				clientId,
				sessionId,
				user: {
					id: user.id,
					name: user.name,
				},
			},
		});

		return null;
	} catch {
		return createUnauthorizedResponse("Invalid access token");
	}
}

export {
	type McpAuthApp,
	type McpPrincipal,
	MCP_PAGE_READ_SCOPE,
	MCP_PAGE_WRITE_SCOPE,
	MCP_USER_READ_SCOPE,
	MCP_USER_WRITE_SCOPE,
};
