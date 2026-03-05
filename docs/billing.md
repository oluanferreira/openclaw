# Billing Configuration (Stripe)

This project uses Better Auth Stripe subscriptions and requires Stripe server keys at runtime.

## Required environment variables

Set these in `apps/web/.env.local`:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

These are validated by `@workspace/billing` env schema.

## Stripe setup checklist

1. Create a Stripe product and recurring price in your Stripe account.
2. Copy the Stripe Price ID.
3. Update the configured plan price in:
   - `packages/billing/src/server.ts` (`plans[0].priceId`)
4. Set `STRIPE_SECRET_KEY` in `apps/web/.env.local`.
5. Create a Stripe webhook endpoint:
   - URL: `${URL}/api/auth/stripe/webhook` (for local dev usually `http://localhost:3000/api/auth/stripe/webhook`)
6. Copy webhook signing secret and set `STRIPE_WEBHOOK_SECRET` in `apps/web/.env.local`.

## Webhook events to enable

Enable at least:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Local webhook testing (optional)

You can forward webhooks locally with Stripe CLI:

```bash
stripe listen --forward-to http://localhost:3000/api/auth/stripe/webhook
```

Use the printed signing secret as `STRIPE_WEBHOOK_SECRET`.

## Behavior tied to billing

- Deploy and instance status/log routes require an active subscription.
- When a subscription ends, the instance cleanup flow is triggered.

## Common issues

- `billing:error.subscription.required` when deploying:
  - User has no active subscription, or webhook sync is not configured.
- Stripe webhook signature errors:
  - `STRIPE_WEBHOOK_SECRET` does not match the endpoint signing secret.
- Checkout opens but subscription state does not update:
  - Missing Stripe webhook events or incorrect webhook URL.
