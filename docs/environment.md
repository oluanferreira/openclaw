# Environment Reference

This project uses **two env files**:

1. Root `.env` (shared base variables)
2. `apps/web/.env.local` (all app-specific/runtime variables)

## 1) Root `.env`

Use this shape in root `.env`:

```bash
# The database URL is used to connect to your database.
DATABASE_URL="postgresql://turbostarter:turbostarter@localhost:5432/openclaw"

# The name of the product. This is used in various places across the apps.
PRODUCT_NAME="TurboClaw"

# The url of the web app. Used mostly to link between apps.
URL="http://localhost:3000"

# Default locale of the apps, can be overridden separately in each app.
DEFAULT_LOCALE="en"
```

## 2) `apps/web/.env.local` (everything else)

All other variables should be set in `apps/web/.env.local`.

Start from:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Then configure:

- client variables derived from root:
  - `NEXT_PUBLIC_PRODUCT_NAME="${PRODUCT_NAME}"`
  - `NEXT_PUBLIC_URL="${URL}"`
  - `NEXT_PUBLIC_DEFAULT_LOCALE="${DEFAULT_LOCALE}"`
- auth variables (`BETTER_AUTH_SECRET`, OAuth client IDs/secrets)
- deployment provider variables (`FLY_*`; `VPS_*`/`GCP_*` only if those providers are enabled)
- billing variables (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
- AI provider keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`)

## Required variables in `apps/web/.env.local`

### Auth

- `BETTER_AUTH_SECRET`
- optional OAuth:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`

### Billing (Stripe)

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

See [billing.md](./billing.md) for full Stripe product/price and webhook setup.

### Fly deploy

- `FLY_API_TOKEN`
- `FLY_ORG_SLUG`
- `FLY_REGION` (default `iad`)
- `FLY_OPENCLAW_IMAGE` (default `ghcr.io/openclaw/openclaw:2026.3.2`)
- `FLY_MACHINE_CPUS` (default `2`)
- `FLY_MACHINE_MEMORY_MB` (default `3072`)
- `FLY_VOLUME_SIZE_GB` (default `1`)
- `FLY_OPENCLAW_STATE_DIR` (default `/data`)

### VPS deploy

- `VPS_HOST`
- `VPS_SSH_PORT` (default `22`)
- `VPS_USER` (default `root`)
- `VPS_PRIVATE_KEY` (`\n` escaped)
- `VPS_PRIVATE_KEY_PASSPHRASE` (optional)
- `VPS_OPENCLAW_STATE_DIR` (default `/var/lib/openclaw`)
- `VPS_OPENCLAW_IMAGE` (default `ghcr.io/openclaw/openclaw:2026.3.2`)
- `VPS_CONTAINER_MEMORY` (default `3g`)
- `VPS_CONTAINER_CPUS` (default `1.5`)
- `VPS_INSTANCE_DOMAIN_SUFFIX`
- `VPS_CADDY_ROUTES_DIR` (default `/etc/caddy/routes`)
- `VPS_CADDY_CONFIG_PATH` (default `/etc/caddy/Caddyfile`)

### GCP deploy

- `GCP_CREDENTIALS` (optional; required in some environments)
- `GCP_PROJECT_ID`
- `GCP_ZONE` (default `us-central1-a`)
- `GCP_INSTANCE_TEMPLATE_NAME` (default `openclaw-gateway-template`)
- `GCP_OPENCLAW_STATE_DIR` (default `/var/lib/openclaw`)
- `GCP_INSTANCE_DOMAIN_SUFFIX` (optional, for wildcard DNS URLs)

### AI providers

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`

## Notes

- Keep `.env` and `apps/web/.env.local` out of version control.
- `NEXT_PUBLIC_*` variables are exposed to browser code.
- Instance URLs are provided by Fly directly as `https://<instance-id>.fly.dev`.
- This repo exports the Fly provider by default. VPS/GCP implementations exist but are not exported unless you enable them in:
  - `packages/openclaw/src/deployment/providers/index.ts`
  - `packages/openclaw/src/deployment/providers/env.ts`
