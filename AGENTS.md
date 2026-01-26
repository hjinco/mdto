# Repository Guidelines

## Project Structure & Module Organization
- `client/`: React + TanStack Start frontend (routes, components, hooks, client libs).
- `server/`: Cloudflare Workers backend (routes, db, server utilities).
- `shared/`: Cross-cutting utilities and templates (markdown pipeline, themes).
- `public/`: Static assets served by the client build.
- `migrations/`: D1/Drizzle database migrations.
- `scripts/`: Build/deploy helpers (template hash, copy output).
- `docs/`: Documentation and translated READMEs.

## Build, Test, and Development Commands
- `pnpm dev`: Run client (Vite) and server (Wrangler) dev servers concurrently.
- `pnpm build`: Generate template hash, type-check, build client, and copy output.
- `pnpm start`: Run the Worker locally via Wrangler.
- `pnpm lint` / `pnpm lint:fix`: Run Biome checks (and auto-fix).
- `pnpm test`: Run Vitest with the Cloudflare Workers pool.
- `pnpm cf-typegen`: Generate Worker types if you hit type errors.

## Coding Style & Naming Conventions
- Formatting/linting: Biome (`biome.json`) is the source of truth.
- Indentation: tabs; string quotes: double.
- TypeScript-first: keep types explicit at module boundaries.
- React conventions: components in `PascalCase`, hooks in `useSomething` style.

## Testing Guidelines
- Test runner: Vitest with Cloudflare Workers pool (`vitest.config.mts`).
- Place tests alongside features when possible; prefer `*.test.ts` or `*.spec.ts`.
- Run focused tests with `pnpm test -- <pattern>` (Vitest filtering).

## Commit & Pull Request Guidelines
- Commit style follows Conventional Commits (examples from history):
  - `feat: add ...`, `fix(auth): ...`, `refactor: ...`, `docs: ...`, `chore: ...`
- PRs should include:
  - A clear summary of changes and rationale.
  - Linked issue/feature if applicable.
  - UI changes: before/after screenshots or short clips.

## Configuration & Deployment Notes
- Local dev requires Node 24+, pnpm 10+, and a Cloudflare account for deploy.
- Worker config lives in `wrangler.jsonc`; R2 lifecycle uses `r2-lifecycle.json`.
- Database tooling uses Drizzle (`drizzle.config.ts`, `migrations/`).
