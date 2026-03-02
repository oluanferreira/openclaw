# VPS Setup and Deployment (Step by Step)

This is the exact runbook to launch this product from scratch on a fresh VPS.

Assumption: Ubuntu 24.04 LTS (or similar Debian-based VPS).

## 1) Provision server

Minimum recommended:

- 2 vCPU
- 4 GB RAM
- 40+ GB SSD

Open firewall:

- `22/tcp` (SSH)
- `80/tcp` (HTTP)
- `443/tcp` (HTTPS)

## 2) Install required services on VPS

### Docker

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
docker --version
```

### Caddy

```bash
apt-get update
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy
caddy version
```

## 3) Prepare Caddy base config

Your main Caddyfile must include:

```caddyfile
import /etc/caddy/routes/*.caddy
```

Create routes folder:

```bash
mkdir -p /etc/caddy/routes
chown -R caddy:caddy /etc/caddy/routes
```

Validate and reload:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

## 4) Configure DNS

Create wildcard DNS record:

- `*.your-openclaw-domain.com` -> VPS public IP

Example:

- `*.openclaw.example.com` -> `203.0.113.10`

## 5) Configure application environment

On the app server (where this repo runs), configure both files from [environment.md](./environment.md):

1. Root `.env` with only:

- `DATABASE_URL`
- `PRODUCT_NAME`
- `URL`
- `DEFAULT_LOCALE`

2. `apps/web/.env.local` with all VPS, auth, AI, and `NEXT_PUBLIC_*` variables.

## 6) Start the app stack

```bash
pnpm install
pnpm services:start
pnpm with-env -F @workspace/db db:migrate
pnpm dev
```

For production, use your standard build/start flow (`pnpm build` + production process manager).

## 7) Deploy first OpenClaw instance from dashboard

1. Sign in to dashboard.
2. Open deploy form.
3. Choose model + Telegram channel config.
4. Submit deployment.

What happens automatically:

- API connects to VPS over SSH.
- Writes instance config to:
  - `<VPS_OPENCLAW_STATE_DIR>/instances/<instance-id>/openclaw.json`
- Starts Docker container for that instance.
- Generates Caddy route file in `/etc/caddy/routes`.
- Validates and reloads Caddy.

## 8) Verify everything on VPS

```bash
ls -la /etc/caddy/routes
docker ps --format '{{.Names}} {{.Ports}}'
```

Check a route file:

```bash
cat /etc/caddy/routes/<instance-id>.<your-domain>.caddy
```

Check instance config:

```bash
cat /var/lib/openclaw/instances/<instance-id>/openclaw.json
```

## 9) Validate in browser

Open:

- `https://<instance-id>.<your-domain>/#token=<token>`

Token is currently stored in DB (`instance.token`) and included in URL returned by API.

## 10) Common recovery actions

If routes are stale:

```bash
rm -f /etc/caddy/routes/*.caddy
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Then redeploy instances from dashboard.
