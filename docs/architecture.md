# Architecture Overview

## Monorepo layout

```text
apps/
  web/         Next.js App Router UI
packages/
  api/         Hono API routes
  auth/        Better Auth
  db/          Drizzle schema + migrations
  openclaw/    Deployment/provider logic + config + CLI command mapping
  i18n/        Localization
  ui/          Shared UI components
```

## Control-plane flow

1. User deploys from dashboard.
2. `apps/web` calls `packages/api` (`/api/openclaw`).
3. `packages/api` calls `@workspace/openclaw` deployment strategy.
4. VPS provider connects over SSH and:
   - writes instance config
   - starts/restarts Docker container
   - writes Caddy route and reloads Caddy
5. Instance metadata is stored in DB table `instance`.

## Instance identity

- Instance id is deterministic from user id hash.
- One active instance per user (`instance.userId` is unique).

## Token and URL behavior

- Deployment generates a token per instance deploy.
- Token is stored in DB (`instance.token`).
- API exposes instance URL including hash fragment token:
  - `https://<instance-id>.<suffix>/#token=<token>`

## Runtime management

- Status and logs are retrieved via SSH + Docker commands.
- Manage actions map to Docker lifecycle commands (`start`, `stop`, `restart`, `rm -f`).
- CLI actions are allowlisted in `packages/openclaw/src/cli/schema.ts` and executed via:
  - `docker exec <instance_id> node dist/index.js <command>`

## Services in production

- `Postgres`: app data and instance metadata
- `API (Hono)`: deployment and management control plane
- `Web (Next.js)`: customer dashboard
- `Docker`: runs one OpenClaw container per user instance
- `Caddy`: TLS termination and host-based routing to instance containers

## Current security posture

- Gateway access currently relies on tokenized URL usage (`#token=...`) and direct Caddy proxying.
- If you need stricter gateway access controls, add an auth layer at the proxy and/or remove direct token exposure in URLs.
