# Security — ClaWin1Click

## Reporting Vulnerabilities

If you discover a security vulnerability, please email **luanferreira.emp@gmail.com** with details. Do not open a public issue.

## Security Architecture

### Authentication & Session Management

| Layer | Technology | Details |
|-------|-----------|---------|
| Auth framework | Better Auth 1.4 | OAuth (Google, GitHub), email/password, passkeys |
| Session | HTTP-only cookies | `sameSite: lax`, `secure: true`, prefix: `openclaw` |
| Session cache | 5-minute TTL | Reduces DB lookups per request |
| Admin access | `ADMIN_EMAILS` env var | Comma-separated list, never hardcoded |

### API Security

| Protection | Implementation |
|-----------|---------------|
| CORS | Whitelist: `clawin1click.com`, `www.clawin1click.com`, `localhost:3000` |
| Rate limiting | 60 req/min per worker (120 effective across PM2 cluster) |
| Deploy rate limit | 5 req/hour per worker (10 effective) |
| Request size | 10 MB max payload |
| Security headers | HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy |

### Data Protection

| Data | Protection |
|------|-----------|
| API keys (OpenAI, Anthropic, Google) | AES-256-GCM encryption at rest |
| Telegram bot tokens | AES-256-GCM encryption at rest |
| API key display | Masked (first 7 + last 4 chars only) |
| Database | Row-Level Security (RLS) with per-request user isolation |
| Error tracking | Sentry replay with `maskAllText` + `maskAllInputs` enabled |

### Row-Level Security (RLS)

RLS is enabled with `FORCE` on 8 user-owned tables:

- `user`, `session`, `subscription`, `instance`
- `instance_skill`, `affiliate`, `support_ticket`, `ticket_reply`

Each request sets `app.current_user_id` via `set_config()` in the auth middleware. Policies ensure users can only access their own data, even if a bug bypasses the ORM layer.

### Infrastructure

| Component | Security Measure |
|-----------|-----------------|
| SSH deployment | Key stored as file (`chmod 600`), not env var |
| PostgreSQL | Password required (no defaults), bound to `127.0.0.1` |
| Docker images | Pinned to specific version (no `:latest`) |
| Python deps | Isolated virtual environment (no `--break-system-packages`) |
| PM2 cluster | 2 workers with per-worker rate limiting |

### Desktop App (ClaWin1Click Desktop — Tauri v2)

| Protection | Implementation |
|-----------|---------------|
| Token storage | OS Keyring (Windows DPAPI / macOS Keychain / Linux libsecret) |
| Shell commands | Wildcard `*` rejected + 18 dangerous commands blocked locally |
| File access | Path traversal blocked, system paths blocked, root dirs rejected |
| Server config | Wildcard commands and root-level paths stripped from server responses |
| CSP | `default-src 'self'`; no `unsafe-inline` |
| TOCTOU | Canonical path resolution before all file operations |
| Logging | Daily log rotation via `tracing-appender` |
| Error handling | All Mutex locks use `match`/`map_err` (no `.unwrap()` panics) |

## Environment Variables

### Required (must be set in production)

```bash
ADMIN_EMAILS          # Comma-separated admin emails
POSTGRES_PASSWORD     # Database password (no default)
BETTER_AUTH_SECRET    # Session signing key
ENCRYPTION_KEY       # AES-256 key for API key encryption (64-char hex)
STRIPE_SECRET_KEY    # Stripe payments
STRIPE_WEBHOOK_SECRET # Webhook signature verification
```

### SSH Key (choose one)

```bash
# Recommended: file-based (not exposed in /proc/PID/environ)
VPS_PRIVATE_KEY_PATH="/root/.ssh/clawin_deploy_key"

# Fallback: env var with escaped newlines
VPS_PRIVATE_KEY="-----BEGIN OPENSSH PRIVATE KEY-----\n..."
```

## Audit History

| Date | Action | Scope |
|------|--------|-------|
| 2026-03-16 | Smith adversarial review | Full Web + Desktop Tauri v2 |
| 2026-03-16 | 19/19 findings resolved | 5 CRITICAL, 7 HIGH, 7 MEDIUM |
