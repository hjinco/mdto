import { validateEnv } from "../config/env";

export type CreateContextOptions = {
	req: Request;
	env: Env;
};

export function createContext({ req, env }: CreateContextOptions) {
	validateEnv(env);
	return { req, env };
}

export type Context = ReturnType<typeof createContext>;
