# Operations Guide — ClaWin1Click

## Architecture Overview

| Component | Technology | Details |
|-----------|-----------|---------|
| Frontend | Next.js 16 | `apps/web/` — React 19, Tailwind v4 |
| API | Hono 4 | `packages/api/` — REST + WebSocket |
| Database | PostgreSQL | Drizzle ORM 0.44 |
| Auth | Better Auth 1.4 | OAuth (Google, GitHub) |
| Payments | Stripe | Subscriptions + webhooks |
| Containers | Docker | OpenClaw agent instances |
| Process Manager | PM2 | Cluster mode, 2 workers |
| Reverse Proxy | Caddy | Auto-TLS, route-per-instance |
| Error Tracking | Sentry | Client + Server + Edge |
| Monitoring | UptimeRobot | Health check every 30s |

## VPS Infrastructure

| Resource | Value |
|----------|-------|
| Provider | Hostinger |
| IP | 187.77.227.95 |
| OS | Ubuntu 24.04 |
| CPU | 2 cores |
| RAM | 8 GB |
| Disk | 96 GB |
| SSH | `ssh root@187.77.227.95` |
| Project Path | `/root/openclaw` |

### Capacity

| Metric | Value |
|--------|-------|
| Container memory | ~500 MB real usage (2 GB limit) |
| Max containers | ~15 (comfortable) |
| Current containers | 3 |
| Target | 5 paying users (~8 containers) |
| Headroom | ~50% |

---

## Deploy

### Quick Deploy

```bash
cd /root/openclaw
./deploy.sh
```

### Deploy Options

```bash
./deploy.sh              # Standard: build + reload + health check
./deploy.sh --skip-build # Reload PM2 with existing build
./deploy.sh --dry-run    # Preview steps without executing
```

### What the Deploy Script Does

1. **Pre-deploy checks** — verifies directory, PM2 process, pnpm availability
2. **Backup** — copies `apps/web/.next` to `.deploy-backups/next-YYYYMMDD-HHMMSS/`
3. **Build** — loads `.env` + `apps/web/.env.local`, runs `pnpm --filter web build`
4. **PM2 reload** — zero-downtime reload via cluster mode (2 workers)
5. **Health check** — hits `https://clawin1click.com/api/status`, retries 3x with 5s interval
6. **Rollback** — if health check fails, restores backup and reloads PM2
7. **Cleanup** — keeps only the last 3 backups

### Manual Rollback

```bash
cd /root/openclaw
ls -lt .deploy-backups/
rm -rf apps/web/.next
cp -a .deploy-backups/next-YYYYMMDD-HHMMSS apps/web/.next
pm2 reload openclaw-web
curl -s -o /dev/null -w '%{http_code}' https://clawin1click.com/api/status
```

---

## PM2 Cluster Mode

The app runs with 2 PM2 workers in cluster mode for resilience.

```bash
pm2 status                 # Check workers
pm2 reload openclaw-web    # Zero-downtime reload
pm2 logs openclaw-web      # View logs
pm2 monit                  # Real-time monitoring
```

**Known limitation:** Rate limiting uses in-memory Map — each worker has its own counter. Effective limit is multiplied by worker count. Acceptable for current scale (~5 users).

---

## Pricing Configuration

Prices are centralized in `packages/shared/src/constants/pricing.ts` and configurable via environment variables.

### Current Prices

| Currency | Display | Stripe Price ID |
|----------|---------|-----------------|
| USD | $29.90/mo | `STRIPE_PRICE_ID_USD` or `STRIPE_PRICE_ID` |
| BRL | R$153,39/mo | `STRIPE_PRICE_ID_BRL` or `STRIPE_PRICE_ID` |

### Changing Prices

1. Create new Price object in [Stripe Dashboard](https://dashboard.stripe.com/prices)
2. Update environment variables:
   ```bash
   # In /root/openclaw/.env
   STRIPE_PRICE_ID_USD=price_new_usd_id
   STRIPE_PRICE_ID_BRL=price_new_brl_id
   ```
3. Update display values (optional):
   ```bash
   # In /root/openclaw/apps/web/.env.local
   NEXT_PUBLIC_PRICE_DISPLAY_USD=$34.90
   NEXT_PUBLIC_PRICE_DISPLAY_BRL=R$179,90
   ```
4. Deploy: `./deploy.sh`

**Fallback chain:** STRIPE_PRICE_ID_{CURRENCY} > STRIPE_PRICE_ID > empty

---

## Billing and Subscriptions

### Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Creates/updates subscription |
| `customer.subscription.updated` | Updates status + period |
| `customer.subscription.updated` (past_due) | Sets grace period (+3 days) |
| `customer.subscription.deleted` | Destroys container, deletes instance |
| `invoice.payment_failed` | Marks past_due, notifies agent |

### Grace Period Flow

```
active -> past_due -> grace period (3 days) -> deleted
```

Banner colors: yellow (>1d), orange (=1d), red (<=0d)

### Stripe Configuration

| Setting | Value |
|---------|-------|
| Mode | Live |
| Webhook | `we_1T5xq7P8Hos97mNkP56wT9Rb` |
| Retry | Cancels after 3 days of failed payment |

---

## Error Tracking (Sentry)

### Configuration

| Layer | Config File |
|-------|------------|
| Client | `apps/web/sentry.client.config.ts` |
| Server | `apps/web/sentry.server.config.ts` |
| Edge | `apps/web/sentry.edge.config.ts` |
| API | `packages/api/src/utils/on-error.ts` |

### Environment Variables

```bash
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=clawin1click
```

### Sampling

| Type | Rate |
|------|------|
| Traces | 20% |
| Session Replay | 10% normal, 100% on error |

Sentry skips 401, 403, 404 errors to reduce noise.

---

## Environment Variables Reference

### Server (.env)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID` | Default Stripe Price ID (fallback) |
| `STRIPE_PRICE_ID_USD` | USD-specific Stripe Price ID |
| `STRIPE_PRICE_ID_BRL` | BRL-specific Stripe Price ID |
| `ENCRYPTION_KEY` | AES-256 key (64 hex chars) |
| `SENTRY_DSN` | Sentry server-side DSN |
| `SENTRY_ORG` | Sentry organization slug |
| `SENTRY_PROJECT` | Sentry project slug |
| `UPTIMEROBOT_API_KEY` | UptimeRobot API key |

### Client (apps/web/.env.local)

| Variable | Description |
|----------|-------------|
| `BETTER_AUTH_SECRET` | Auth session secret |
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API key |
| `NEXT_PUBLIC_URL` | Public app URL |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry client-side DSN |
| `NEXT_PUBLIC_PRICE_DISPLAY_USD` | USD price display (default: $29.90) |
| `NEXT_PUBLIC_PRICE_DISPLAY_BRL` | BRL price display (default: R$153,39) |
| `NEXT_PUBLIC_NEXT_PRICE_DISPLAY_USD` | Next USD price display (default: $39.90) |
| `NEXT_PUBLIC_NEXT_PRICE_DISPLAY_BRL` | Next BRL price display (default: R$199,90) |

---

## Container Management

### Check container state

```bash
docker inspect --format '{{.State.Status}} {{.State.Error}}' <instance_id>
docker logs --timestamps --details <instance_id>
```

### Container config

```bash
cat /opt/openclaw/instances/<instance_id>/openclaw.json
```

### Container limits

| Setting | Value |
|---------|-------|
| Memory | 2 GB (hard limit) |
| CPUs | 1.5 |
| PIDs | 512 |
| Filesystem | Read-only |
| Node.js heap | 1024 MB |

---

## Caddy (Reverse Proxy)

```bash
ls -la /etc/caddy/routes
cat /etc/caddy/routes/<instance_host>.caddy
caddy validate --config /etc/caddy/Caddyfile
caddy reload --config /etc/caddy/Caddyfile
```

### Route reset (stale files)

```bash
rm -f /etc/caddy/routes/*.caddy
caddy validate --config /etc/caddy/Caddyfile
caddy reload --config /etc/caddy/Caddyfile
```

---

## Database

```bash
pnpm with-env -F @workspace/db db:migrate
pnpm with-env -F @workspace/db db:generate
pnpm with-env -F @workspace/db db:studio
```

### Backups

Cron: `0 3 * * *` -> `/root/backups/postgres/`

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Health check (DB ping + latency) |
| `/api/openclaw/status` | GET | Instance status |
| `/api/openclaw/logs` | GET | Instance logs |
| `/api/openclaw/pairing` | GET | Pairing requests |
| `/api/openclaw/manage` | POST | Instance lifecycle |
| `/api/openclaw/cli` | POST | CLI commands |
| `/api/billing/checkout` | POST | Stripe checkout |
| `/api/billing/portal` | POST | Stripe customer portal |
| `/api/billing/webhooks` | POST | Stripe webhook handler |

### Rate Limits

| Scope | Limit |
|-------|-------|
| Global | 120 req/min per IP |
| OpenClaw routes | 10 req/hour per IP |

---

## Build and Quality

```bash
pnpm typecheck                        # TypeScript (all packages)
pnpm lint                             # ESLint
pnpm build                            # Full build
pnpm --filter web build               # Web only
cd packages/api && npx vitest run     # Billing tests (45 tests)
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check env vars, run `pnpm install` |
| Health check fails | Check `pm2 logs`, verify DB connection |
| PM2 not running | `pm2 start ecosystem.config.js` |
| Container won't start | Check disk space, Docker logs |
| Webhook failures | Verify `STRIPE_WEBHOOK_SECRET` |
| Sentry not receiving | Verify `SENTRY_DSN` env vars |
| Rate limit too aggressive | Adjust in `packages/api/src/middleware.ts` |

---

*Last updated: 2026-03-07 — EPIC-1 Scale-Readiness*
