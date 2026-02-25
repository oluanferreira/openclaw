# VPS Deployment Setup Guide

This repo deploys one OpenClaw Gateway container per user onto a single VPS, then
provisions a Caddy route:

1. `https://<instance-id>.<VPS_INSTANCE_DOMAIN_SUFFIX>` terminates TLS in Caddy.
2. Caddy reverse proxies traffic directly to the container.

## Required Environment Variables

Set these in root `.env` (API process environment).

| Variable | Description | Example |
| --- | --- | --- |
| `VPS_HOST` | VPS public IP/DNS used for SSH | `203.0.113.10` |
| `VPS_SSH_PORT` | SSH port | `22` |
| `VPS_USER` | SSH user | `root` |
| `VPS_PRIVATE_KEY` | SSH private key content (`\n` escaped) | `-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----` |
| `VPS_PRIVATE_KEY_PASSPHRASE` | Optional SSH key passphrase | `secret` |
| `VPS_DEPLOY_ROOT` | Root dir for instance state on VPS | `/opt/openclaw` |
| `VPS_OPENCLAW_IMAGE` | Docker image with OpenClaw gateway build | `ghcr.io/openclaw/openclaw:2026.2.24` |
| `VPS_INSTANCE_DOMAIN_SUFFIX` | Wildcard suffix for instance hosts | `openclaw.turbostarter.dev` |
| `OPENAI_API_KEY` | Model provider key (required by env schema) | `...` |
| `ANTHROPIC_API_KEY` | Model provider key (required by env schema) | `...` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Model provider key (required by env schema) | `...` |

Optional:

| Variable | Description | Example |
| --- | --- | --- |
| `VPS_CADDY_ROUTES_DIR` | Directory where per-instance Caddy routes are written | `/etc/caddy/routes` |
| `VPS_CADDY_CONFIG_PATH` | Main Caddyfile path | `/etc/caddy/Caddyfile` |
| `VPS_CONTAINER_MEMORY` | Memory limit per container | `2g` |
| `VPS_CONTAINER_CPUS` | CPU limit per container | `1.5` |
| `VPS_NODE_MAX_OLD_SPACE_SIZE` | Node heap size in MB | `1024` |

## Caddy Prerequisites

Before first deploy, Caddy must already be running on VPS and be responsible for
`*.<VPS_INSTANCE_DOMAIN_SUFFIX>` TLS/HTTP traffic.

The deployer will append this line to your main Caddyfile if missing:

```caddyfile
import /etc/caddy/routes/*.caddy
```

## Frontend Command Execution

Commands run via `docker exec` with the per-instance gateway token and do not
require trusted-proxy header injection.

After enabling this code, redeploy existing instances so the latest route and
container config are applied.

## Preflight Checks

```bash
ssh -p <VPS_SSH_PORT> <VPS_USER>@<VPS_HOST> \
  "docker --version && caddy version && caddy validate --config /etc/caddy/Caddyfile"
```

After one deploy completes:

```bash
ssh -p <VPS_SSH_PORT> <VPS_USER>@<VPS_HOST> \
  "ls -la /etc/caddy/routes && docker ps --format '{{.Names}} {{.Ports}}'"
```

## If You See Gateway Dashboard + `disconnected (1006)`

That means HTTP reached the gateway page, but WebSocket auth did not pass.
Check these first:

1. Route file for the instance exists in `VPS_CADDY_ROUTES_DIR`.
2. Caddy route contains `reverse_proxy 127.0.0.1:<port>`.
3. Container config file `<VPS_DEPLOY_ROOT>/instances/<id>/openclaw.json` has:
   - `"auth.mode": "token"`
   - a non-empty token value.
