import { db } from "@server/db/client";
import * as schema from "@server/db/schema";
import { eq, or } from "drizzle-orm";
import { Hono } from "hono";
import { getSignedCookie, setCookie, setSignedCookie } from "hono/cookie";
import { auth } from "../lib/auth";
import { E2E_USER_COOKIE_NAME } from "../lib/test-auth";

const TEST_LOGIN_PATH = "/login";

type TestAuthApp = {
	Bindings: Env;
};

type TestAuthEnv = Env & {
	ENABLE_E2E_AUTH?: string;
	E2E_AUTH_SECRET?: string;
};

type LoginPayload = {
	name?: string;
	email?: string;
};

export const testAuthRouter = new Hono<TestAuthApp>();

function readTestAuthEnv(env: Env): TestAuthEnv {
	return env as TestAuthEnv;
}

function ensureTestAuthAccess(request: Request, env: Env) {
	const testEnv = readTestAuthEnv(env);
	if (testEnv.ENABLE_E2E_AUTH !== "1") {
		return new Response("Not found", { status: 404 });
	}

	const expectedSecret = testEnv.E2E_AUTH_SECRET;
	const providedSecret = request.headers.get("x-e2e-auth-secret");
	if (!expectedSecret || providedSecret !== expectedSecret) {
		return new Response("Unauthorized", { status: 401 });
	}

	return null;
}

function createUserId(name: string) {
	return `e2e_${name}`;
}

function normalizeLoginPayload(input: LoginPayload) {
	const name = input.name?.trim().toLowerCase() || "e2e-tester";
	const email = input.email?.trim().toLowerCase() || `${name}@example.com`;

	if (!name || !email) {
		throw new Error("Name and email are required");
	}

	return { name, email };
}

testAuthRouter.post(TEST_LOGIN_PATH, async (c) => {
	const accessError = ensureTestAuthAccess(c.req.raw, c.env);
	if (accessError) return accessError;

	let payload: LoginPayload;
	try {
		payload = await c.req.json<LoginPayload>();
	} catch {
		return c.json({ message: "Invalid JSON body" }, 400);
	}

	let login: ReturnType<typeof normalizeLoginPayload>;
	try {
		login = normalizeLoginPayload(payload);
	} catch (error) {
		return c.json(
			{
				message: error instanceof Error ? error.message : "Invalid payload",
			},
			400,
		);
	}

	const now = new Date();
	const userId = createUserId(login.name);
	const authContext = await auth.$context;
	const authCookies = authContext.authCookies;

	await authContext.internalAdapter.deleteSessions(userId);

	await db
		.delete(schema.user)
		.where(
			or(
				eq(schema.user.id, userId),
				eq(schema.user.name, login.name),
				eq(schema.user.email, login.email),
			),
		);

	await db.insert(schema.user).values({
		id: userId,
		name: login.name,
		email: login.email,
		emailVerified: true,
		image: null,
		isDashboardPublic: false,
		createdAt: now,
		updatedAt: now,
	});

	const session = await authContext.internalAdapter.createSession(
		userId,
		false,
		{
			ipAddress: null,
			userAgent: c.req.header("user-agent"),
		},
	);

	// Clear any cached session cookie so the next getSession call rehydrates from the token.
	setCookie(c, authCookies.sessionData.name, "", {
		...authCookies.sessionData.attributes,
		maxAge: 0,
	});
	await setSignedCookie(
		c,
		authCookies.sessionToken.name,
		session.token,
		c.env.BETTER_AUTH_SECRET,
		{
			...authCookies.sessionToken.attributes,
			expires: session.expiresAt,
		},
	);
	setCookie(
		c,
		E2E_USER_COOKIE_NAME,
		JSON.stringify({
			id: userId,
			name: login.name,
			email: login.email,
		}),
		{
			path: "/",
			sameSite: "Lax",
			expires: session.expiresAt,
		},
	);

	return c.json({
		ok: true,
		user: {
			id: userId,
			name: login.name,
			email: login.email,
		},
		session: {
			id: session.id,
			expiresAt: session.expiresAt.toISOString(),
		},
	});
});

testAuthRouter.post("/logout", async (c) => {
	const accessError = ensureTestAuthAccess(c.req.raw, c.env);
	if (accessError) return accessError;

	const authContext = await auth.$context;
	const authCookies = authContext.authCookies;
	const sessionToken = await getSignedCookie(
		c,
		c.env.BETTER_AUTH_SECRET,
		authCookies.sessionToken.name,
	);
	if (sessionToken) {
		await db
			.delete(schema.session)
			.where(eq(schema.session.token, sessionToken));
	}

	setCookie(c, authCookies.sessionData.name, "", {
		...authCookies.sessionData.attributes,
		maxAge: 0,
	});
	setCookie(c, authCookies.sessionToken.name, "", {
		...authCookies.sessionToken.attributes,
		maxAge: 0,
	});
	setCookie(c, E2E_USER_COOKIE_NAME, "", {
		path: "/",
		sameSite: "Lax",
		maxAge: 0,
	});

	return c.json({ ok: true });
});

testAuthRouter.get("/session", async (c) => {
	const accessError = ensureTestAuthAccess(c.req.raw, c.env);
	if (accessError) return accessError;

	return c.json(await auth.api.getSession(c.req.raw));
});
