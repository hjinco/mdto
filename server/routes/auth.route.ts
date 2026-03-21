import { type Context, Hono } from "hono";
import { auth } from "../lib/auth";

type AuthApp = {
	Bindings: Env;
};

export const authRouter = new Hono<AuthApp>();

const PUBLIC_AUTH_ALLOWED_METHODS = "GET, POST, OPTIONS";
const PUBLIC_AUTH_ALLOWED_HEADERS = [
	"accept",
	"authorization",
	"content-type",
	"mcp-protocol-version",
].join(", ");

function isPublicOAuthPath(pathname: string) {
	return (
		pathname === "/api/auth/jwks" || pathname.startsWith("/api/auth/oauth2/")
	);
}

function setPublicOAuthCorsHeaders(c: Context<AuthApp>) {
	c.header("Access-Control-Allow-Origin", "*");
	c.header("Access-Control-Allow-Methods", PUBLIC_AUTH_ALLOWED_METHODS);
	c.header("Access-Control-Allow-Headers", PUBLIC_AUTH_ALLOWED_HEADERS);
	c.header("Access-Control-Max-Age", "86400");
}

function appendPublicOAuthCorsHeaders(response: Response) {
	response.headers.set("Access-Control-Allow-Origin", "*");
	response.headers.set(
		"Access-Control-Allow-Methods",
		PUBLIC_AUTH_ALLOWED_METHODS,
	);
	response.headers.set(
		"Access-Control-Allow-Headers",
		PUBLIC_AUTH_ALLOWED_HEADERS,
	);
	response.headers.set("Access-Control-Max-Age", "86400");
	return response;
}

authRouter.use("*", async (c, next) => {
	const pathname = new URL(c.req.url).pathname;
	if (!isPublicOAuthPath(pathname)) {
		await next();
		return;
	}

	setPublicOAuthCorsHeaders(c);
	if (c.req.method === "OPTIONS") {
		return c.body(null, 204);
	}

	await next();
});

authRouter.on(["POST", "GET"], "*", (c) => {
	const pathname = new URL(c.req.url).pathname;
	const response = auth.handler(c.req.raw);
	if (!isPublicOAuthPath(pathname)) {
		return response;
	}

	return Promise.resolve(response).then((resolvedResponse) => {
		return appendPublicOAuthCorsHeaders(resolvedResponse);
	});
});
