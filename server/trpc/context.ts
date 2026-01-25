export type CreateContextOptions = {
	req: Request;
	env: Env;
};

export function createContext({ req, env }: CreateContextOptions) {
	return { req, env };
}

export type Context = ReturnType<typeof createContext>;
