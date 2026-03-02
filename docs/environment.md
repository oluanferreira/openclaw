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
- auth variables (`BETTER_AUTH_SECRET`, OAuth client IDs/secrets)- VPS deployment variables (`VPS_*`) or GCP deployment variables (`GCP_*`)
- AI provider keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`)

## Required variables in `apps/web/.env.local`

### Auth

- `BETTER_AUTH_SECRET`
- optional OAuth:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`

### VPS deploy

- `VPS_HOST`
- `VPS_SSH_PORT` (default `22`)
- `VPS_USER` (default `root`)
- `VPS_PRIVATE_KEY` (`\n` escaped)
- `VPS_PRIVATE_KEY_PASSPHRASE` (optional)
- `VPS_OPENCLAW_STATE_DIR` (default `/var/lib/openclaw`)
- `VPS_OPENCLAW_IMAGE` (default `ghcr.io/openclaw/openclaw:2026.2.24`)
- `VPS_CONTAINER_MEMORY` (default `2g`)
- `VPS_CONTAINER_CPUS` (default `1.5`)
- `VPS_NODE_MAX_OLD_SPACE_SIZE` (default `1024`)
- `VPS_INSTANCE_DOMAIN_SUFFIX`
- `VPS_CADDY_ROUTES_DIR` (default `/etc/caddy/routes`)
- `VPS_CADDY_CONFIG_PATH` (default `/etc/caddy/Caddyfile`)

### GCP deploy

- `GCP_PROJECT_ID`
- `GCP_ZONE` (default `us-central1-a`)
- `GCP_INSTANCE_TEMPLATE_NAME` (required)
- `GCP_OPENCLAW_IMAGE` (default `ghcr.io/openclaw/openclaw:2026.2.24`)
- `GCP_GATEWAY_PORT` (default `18789`)
- `GCP_OPENCLAW_STATE_DIR` (default `/var/lib/openclaw`)
- `GCP_NODE_MAX_OLD_SPACE_SIZE` (default `1024`)
- `GCP_URL_SCHEME` (`http` or `https`, default `http`)
- `GCP_INSTANCE_DOMAIN_SUFFIX` (optional, for wildcard DNS URLs)

### AI providers

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`

## Notes

- Keep `.env` and `apps/web/.env.local` out of version control.
- `NEXT_PUBLIC_*` variables are exposed to browser code.
