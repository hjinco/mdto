## Project Structure & Module Organization
- `client/`: React + TanStack Start frontend (routes, components, hooks, client libs).
- `server/`: Cloudflare Workers backend (routes, db, server utilities).
- `shared/`: Cross-cutting utilities and templates (markdown pipeline, themes).
- `public/`: Static assets served by the client build.
- `migrations/`: D1/Drizzle database migrations.
- `scripts/`: Build/deploy helpers (template hash, copy output).

## Build, Test, and Development Commands
- `pnpm build`: Generate template hash, type-check, build client, and copy output.
- `pnpm lint` / `pnpm lint:fix`: Run Biome checks (and auto-fix).
- `pnpm test`: Run Vitest with the Cloudflare Workers pool.

## Working Rules
- After making code changes, run `pnpm lint:fix` before finishing unless the user explicitly says not to.
