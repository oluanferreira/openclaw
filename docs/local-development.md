# Local Development Setup

Use this if you are customizing or operating your own fork of this product.

## Prerequisites

- Node.js `>=22.17.0`
- pnpm `10.30.0`
- Docker (for local Postgres)

## 1) Install dependencies

```bash
pnpm install
```

## 2) Configure environment

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
```

Set required values from [environment.md](./environment.md).

Root `.env` should contain only:

- `DATABASE_URL`
- `PRODUCT_NAME`
- `URL`
- `DEFAULT_LOCALE`

Set all other runtime values (auth, VPS, AI keys, `NEXT_PUBLIC_*`) in:

- `apps/web/.env.local`

## 3) Start local services (Postgres)

```bash
pnpm services:start
```

Check:

```bash
pnpm services:status
```

## 4) Run DB migrations

```bash
pnpm with-env -F @workspace/db db:migrate
```

## 5) Start dev apps

```bash
pnpm dev
```

For web only:

```bash
pnpm --filter web dev
```

## 6) Quality checks

```bash
pnpm typecheck
pnpm lint
```

## Common issues

- Services not running: `pnpm services:start`
- DB connection errors: verify `DATABASE_URL` and Docker status
- Env validation errors: confirm root `.env` + `apps/web/.env.local` are both configured
- Monorepo cache issues: `pnpm clean && pnpm install`
