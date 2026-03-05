# TurboClaw Docs

1. [Environment Reference](./environment.md)
2. [Billing Configuration (Stripe)](./billing.md)
3. [VPS Setup and Deployment](./vps-setup.md)
4. [Google Cloud Deployment](./google-cloud.md)
5. [Local Development Setup](./local-development.md)
6. [Operations Runbook](./operations.md)
7. [Architecture Overview](./architecture.md)

## What's inside?

- Web dashboard to deploy and manage per-user OpenClaw instances
- API layer for deployment, status, logs, pairing, and CLI actions
- VPS deployment automation over SSH
- GCP deployment automation via Compute Engine SDK + instance templates
- Caddy route generation per instance host
- Dockerized OpenClaw runtime per user

## Core Stack (brief)

- `Next.js` (web app)
- `Hono` (API)
- `Better Auth` (auth/session)
- `Postgres + Drizzle` (data layer)
- `Docker` (instance runtime)
- `Caddy` (HTTPS + routing)
