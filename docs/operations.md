# Operations

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
cat /var/lib/openclaw/instances/<instance_id>/openclaw.json
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
