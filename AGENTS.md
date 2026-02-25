# AGENTS.md

Guide for AI agents working on the TurboClaw monorepo.

## Agent rules

**DO:**
- Read existing files before editing; understand imports and structure first
- Keep diffs minimal and scoped to the request
- Use `pnpm --filter <pkg>` for package-specific commands
- Use `pnpm with-env` for commands needing environment variables
- Add dependencies via `pnpm add -F <pkg>` in the appropriate package
- Follow existing code style, naming, and file layout
- Use explicit types; prefer `interface` over `type` for objects
- Use Zod for validation
- Check `packages/*` for shared helpers before duplicating logic
- Import from package entry points (`@workspace/ui-web`, not deep paths)
- Verify a script exists in the target `package.json` before running it

**DON'T:**
- Commit, push, or modify git state unless explicitly asked
- Run destructive commands (`reset --hard`, force-push) without permission
- Invent ad-hoc scripts; use repo commands from the table below
- Reformat unrelated code or make drive-by changes
- Delete or rewrite unrelated code
- Use `any` or unsafe type casts
- Use enums (prefer maps/objects)
- Use classes (prefer functions)

## Where to look first

| Task | Start here |
| ---- | ---------- |
| Auth logic | `packages/auth/` -> then `apps/web/src/lib/auth/` and `apps/web/src/modules/auth/` |
| API endpoints | `packages/api/src/modules/{auth,openclaw}/` |
| OpenClaw domain | `packages/openclaw/src/{config,deployment}/` |
| Database schema | `packages/db/src/schema/` |
| UI components | `packages/ui/web/src/components/` and `packages/ui/shared/src/` |
| Web pages | `apps/web/src/app/[locale]/` |
| Dashboard features | `apps/web/src/modules/dashboard/` |
| Translations | `packages/i18n/src/translations/` |
| Shared utils/schema | `packages/shared/src/{utils,schema,constants}/` |
| Tooling scripts | `tooling/scripts/src/` |

## Project structure

```
apps/
  web/         Next.js App Router (src/app/[locale]/{(marketing),dashboard}, src/modules/)

packages/
  api/         @workspace/api       Hono modules (auth, openclaw)
  auth/        @workspace/auth      Better Auth server + clients
  db/          @workspace/db        Drizzle schema, migrations, scripts
  i18n/        @workspace/i18n      Translations + server/client utils
  openclaw/    @workspace/openclaw  OpenClaw config + deployment logic
  shared/      @workspace/shared    Constants, schema, logger, utils
  ui/shared/   @workspace/ui        Shared UI styles/assets/utils
  ui/web/      @workspace/ui-web    Web UI components + hooks

tooling/       ESLint, Prettier, TypeScript, scripts, GitHub helpers
```

## Commands

| Task | Command |
| ---- | ------- |
| Install deps | `pnpm install` |
| Dev (all/specific) | `pnpm dev` / `pnpm --filter web dev` |
| Build (all/specific) | `pnpm build` / `pnpm --filter web build` |
| Start web (prod) | `pnpm --filter web start` |
| Lint/Format/Typecheck | `pnpm lint` / `pnpm format` / `pnpm typecheck` |
| Fix lint/format | `pnpm lint:fix` / `pnpm format:fix` |
| Clean | `pnpm clean` |
| Services | `pnpm services:setup` / `pnpm services:start` / `pnpm services:status` / `pnpm services:logs` / `pnpm services:stop` |
| DB migrate | `pnpm with-env -F @workspace/db db:migrate` |
| DB generate | `pnpm with-env -F @workspace/db db:generate` |
| DB status/reset | `pnpm with-env -F @workspace/db db:status` / `pnpm with-env -F @workspace/db db:reset` |
| DB studio | `pnpm with-env -F @workspace/db db:studio` |
| Auth schema generate | `pnpm with-env -F @workspace/auth db:generate` |

Environment: create `.env` at repo root with `DATABASE_URL`, `PRODUCT_NAME`, `URL`, `DEFAULT_LOCALE`.

## Code conventions

- TypeScript: functional, declarative; no classes
- Naming: `isLoading`, `hasError`, `handleClick`
- File layout: exported component -> subcomponents -> helpers -> types
- Error handling: guard clauses, early returns
- JSX: declarative, minimal curly braces
- Commits: Conventional Commits

## App-specific

**Web:** RSC by default; `use client` only when needed; `Suspense` for client components; `nuqs` for URL state; `@workspace/ui-web`

**API:** Keep modules under `packages/api/src/modules/`; validate input with Zod; reuse shared schemas from `@workspace/shared` when possible.

**OpenClaw package:** Keep provider-specific logic under `packages/openclaw/src/deployment/providers/`; keep env/schema validation in package-local `env.ts`/`schema.ts`.

## Troubleshooting

| Issue | Fix |
| ----- | --- |
| Version mismatch | Check `package.json#packageManager` |
| Services refused | `pnpm services:start`, verify Docker running |
| Env not loaded | Create `.env` at root; use `pnpm with-env` |
| Module issues | `pnpm clean && pnpm install` |
| Missing command | Check the target package `package.json` scripts and run via `pnpm --filter <pkg> <script>` |
