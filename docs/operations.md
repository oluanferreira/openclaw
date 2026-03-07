# Operations

## Deploy

### Quick Deploy

```bash
cd /root/openclaw
./deploy.sh
```

### Deploy Options

```bash
# Standard deploy (build + reload + health check)
./deploy.sh

# Skip build (reload PM2 with existing .next build)
./deploy.sh --skip-build

# Dry run (preview what would happen, no changes)
./deploy.sh --dry-run
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

If you need to rollback outside the deploy script:

```bash
cd /root/openclaw
# List available backups
ls -lt .deploy-backups/

# Restore a specific backup
rm -rf apps/web/.next
cp -a .deploy-backups/next-YYYYMMDD-HHMMSS apps/web/.next
pm2 reload openclaw-web

# Verify
curl -s -o /dev/null -w '%{http_code}' https://clawin1click.com/api/status
```

### Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check `pnpm --filter web build` output; env vars may be missing |
| Health check fails after deploy | Script auto-rollbacks; check `pm2 logs openclaw-web --lines 50` |
| PM2 not running | `pm2 start ecosystem.config.js` |
| No backup to rollback to | First deploy or backups were cleaned; rebuild manually |
| Disk space low | Check `.deploy-backups/` size; reduce `MAX_BACKUPS` in script |

### Environment Variables

The deploy script loads environment from two files:

| File | Contents |
|------|----------|
| `/root/openclaw/.env` | Database URL, Stripe keys, encryption key, UptimeRobot key |
| `/root/openclaw/apps/web/.env.local` | Auth secrets, AI API keys, app-specific config |

Both files are loaded with `set -a` (auto-export) before the build step.

---

## Local service operations

```bash
pnpm services:start
pnpm services:status
pnpm services:logs
pnpm services:stop
```

## DB operations

```bash
pnpm with-env -F @workspace/db db:migrate
pnpm with-env -F @workspace/db db:generate
pnpm with-env -F @workspace/db db:studio
```

## Build and checks

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## VPS instance troubleshooting

### Check container state

```bash
docker inspect --format '{{.State.Status}} {{.State.Error}}' <instance_id>
docker logs --timestamps --details <instance_id>
```

### Check generated config

```bash
cat /opt/openclaw/instances/<instance_id>/openclaw.json
```

### Check Caddy routes

```bash
ls -la /etc/caddy/routes
cat /etc/caddy/routes/<instance_host>.caddy
caddy validate --config /etc/caddy/Caddyfile
caddy reload --config /etc/caddy/Caddyfile
```

### Route reset (when stale files cause bad behavior)

```bash
rm -f /etc/caddy/routes/*.caddy
caddy validate --config /etc/caddy/Caddyfile
caddy reload --config /etc/caddy/Caddyfile
```

Then redeploy instances.

## App-side API flow for instance control

- Status: `GET /api/openclaw/status`
- Logs: `GET /api/openclaw/logs`
- Pairing requests: `GET /api/openclaw/pairing`
- Instance lifecycle: `POST /api/openclaw/manage`
- CLI commands: `POST /api/openclaw/cli`

CLI endpoint commands are validated by Zod in `@workspace/openclaw/cli`.
