import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	basePath: "/api/auth",
});

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
