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
4. Active provider strategy executes deployment:
   - Current default export: Fly provider (app + volume + machine via Machines API)
   - Optional implementations in repo: VPS (SSH + Docker + Caddy) and GCP (Compute Engine instance template + startup script)
5. Instance metadata is stored in DB table `instance`.

## Instance identity

- Instance id is deterministic from user id hash.
- One active instance per user (`instance.userId` is unique).

## Token and URL behavior

- Deployment generates a token per instance deploy.
- Token is stored in DB (`instance.token`).
- API exposes instance URL including hash fragment token:
  - Fly: `https://<instance-id>.fly.dev/#token=<token>`
  - VPS/GCP: `https://<instance-id>.<suffix>/#token=<token>`

## Runtime management

- Status, lifecycle actions, and logs are provider-specific (Fly Machines API or SSH/Docker/GCP APIs).
- CLI actions are allowlisted in `packages/openclaw/src/cli/schema.ts` and executed via:
  - Fly: `POST /apps/{app_name}/machines/{machine_id}/exec`
  - VPS/GCP: remote command execution on the target runtime

## Runtime dependencies

- `Postgres`: app data and instance metadata
- `API (Hono)`: deployment and management control plane
- `Web (Next.js)`: customer dashboard
- Provider-specific runtime:
  - default: `Fly.io` machine + persistent volume per user instance
  - optional (if enabled): VPS Docker + Caddy routing, or GCP VM-per-user from instance templates

## Current security posture

- Gateway access currently relies on tokenized URL usage (`#token=...`) and provider ingress.
- If you need stricter gateway access controls, add an upstream auth layer and/or remove direct token exposure in URLs.
