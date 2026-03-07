import { Hono } from "hono";
import Stripe from "stripe";

import { db } from "@workspace/db/server";
import { subscription } from "@workspace/db/schema";
import { eq } from "@workspace/db";
import { generateId } from "@workspace/shared/utils";
import { HttpStatusCode } from "@workspace/shared/constants";
import { HttpException } from "@workspace/shared/utils";

import { getInstanceByUserId, deleteInstance, notifyAgent, destroyInstanceFull } from "@workspace/openclaw/server";
import { logger } from "@workspace/shared/logger";

import { env } from "../../env";
import { enforceAuth } from "../../middleware";
import { getPriceId } from "@workspace/shared/constants/pricing";


const ADMIN_EMAILS = ["luanferreira.emp@gmail.com", "luizjuniorbjj@gmail.com"];
let _stripe: Stripe | null = null;
const getStripe = () => {
  if (!_stripe) _stripe = new Stripe(env.STRIPE_SECRET_KEY);
  return _stripe;
};

export const billingRouter = new Hono()
  .post("/webhook", async (c) => {
    const sig = c.req.header("stripe-signature");
    if (!sig) {
      throw new HttpException(HttpStatusCode.BAD_REQUEST);
    }

    const rawBody = await c.req.text();

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(
        rawBody,
        sig,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      throw new HttpException(HttpStatusCode.BAD_REQUEST);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (!userId) return c.json({ received: true });

      const stripeSubscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;

      let currentPeriodEnd: Date | null = null;
      if (stripeSubscriptionId) {
        const sub = await getStripe().subscriptions.retrieve(stripeSubscriptionId);
        currentPeriodEnd = new Date(sub.current_period_end * 1000);
      }

      await db
        .insert(subscription)
        .values({
          id: generateId(),
          userId,
          stripeCustomerId:
            typeof session.customer === "string"
              ? session.customer
              : (session.customer?.id ?? null),
          stripeSubscriptionId,
          stripePriceId: env.STRIPE_PRICE_ID,
          status: "active",
          currentPeriodEnd,
        })
        .onConflictDoUpdate({
          target: subscription.userId,
          set: {
            stripeCustomerId:
              typeof session.customer === "string"
                ? session.customer
                : (session.customer?.id ?? null),
            stripeSubscriptionId,
            stripePriceId: env.STRIPE_PRICE_ID,
            status: "active",
            currentPeriodEnd,
            updatedAt: new Date(),
          },
        });
    }

    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;

      await db
        .update(subscription)
        .set({
          status: sub.status === "active" ? "active" : sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          updatedAt: new Date(),
        })
        .where(eq(subscription.stripeCustomerId, customerId));

      if (sub.status === "past_due") {
        const dbSub = await db.query.subscription.findFirst({
          where: (t, { eq: eqFn }) => eqFn(t.stripeCustomerId, customerId),
        });
        if (dbSub) {
          const inst = await getInstanceByUserId(dbSub.userId);
          if (inst) {
            const deadline = new Date(sub.current_period_end * 1000);
            deadline.setDate(deadline.getDate() + 3);
            const deadlineStr = deadline.toLocaleDateString("pt-BR");
            await notifyAgent(
              inst.id,
              `ALERTA: Pagamento da assinatura falhou. Seu OpenClaw será desligado em ${deadlineStr} se o pagamento não for regularizado. Por favor, avise seu usuário imediatamente pelo canal de comunicação.`,
            ).catch(() => {});
          }
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;

      await db
        .update(subscription)
        .set({
          status: "inactive",
          updatedAt: new Date(),
        })
        .where(eq(subscription.stripeCustomerId, customerId));

      const dbSub = await db.query.subscription.findFirst({
        where: (t, { eq: eqFn }) => eqFn(t.stripeCustomerId, customerId),
      });
      if (dbSub) {
        const inst = await getInstanceByUserId(dbSub.userId);
        if (inst) {
          await notifyAgent(
            inst.id,
            "Assinatura cancelada. Este OpenClaw será desligado agora.",
          ).catch(() => {});
          await destroyInstanceFull(inst.id).catch((e) =>
            logger.error("destroyInstanceFull failed", e),
          );
          await deleteInstance(inst.id);
        }
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id ?? null;
      if (customerId) {
        await db
          .update(subscription)
          .set({
            status: "past_due",
            updatedAt: new Date(),
          })
          .where(eq(subscription.stripeCustomerId, customerId));

        const dbSub = await db.query.subscription.findFirst({
          where: (t, { eq: eqFn }) => eqFn(t.stripeCustomerId, customerId),
        });
        if (dbSub) {
          const inst = await getInstanceByUserId(dbSub.userId);
          if (inst) {
            await notifyAgent(
              inst.id,
              "ALERTA URGENTE: Tentativa de cobrança da sua assinatura falhou. Regularize o pagamento em até 3 dias para evitar o desligamento. Avise seu usuário imediatamente.",
            ).catch(() => {});
          }
        }
      }
    }

    return c.json({ received: true });
  })
  .use(enforceAuth)
  .get("/subscription", async (c) => {
    const user = c.var.user;

    // Admin accounts bypass subscription requirement
    if (ADMIN_EMAILS.includes(user.email)) {
      return c.json({
        id: "admin",
        userId: user.id,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
        status: "active",
        currentPeriodEnd: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const result = await db.query.subscription.findFirst({
      where: (t, { eq: eqFn }) => eqFn(t.userId, user.id),
    });
    return c.json(result ?? null);
  })
  .post("/checkout", async (c) => {
    const user = c.var.user;
    const baseUrl = env.URL;
    const body = await c.req.json().catch(() => ({}));
    const currency: "usd" | "brl" =
      body.currency === "brl" ? "brl" : "usd";

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      currency,
      line_items: [{ price: getPriceId(currency) || env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/dashboard/billing`,
      client_reference_id: user.id,
      customer_email: user.email,
    });

    return c.json({ url: session.url });
  })
  .post("/portal", async (c) => {
    const userId = c.var.user.id;
    const baseUrl = env.URL;

    const sub = await db.query.subscription.findFirst({
      where: (t, { eq: eqFn }) => eqFn(t.userId, userId),
    });

    if (!sub?.stripeCustomerId) {
      throw new HttpException(HttpStatusCode.NOT_FOUND, {
        code: "billing:subscription.notFound",
      });
    }

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${baseUrl}/dashboard/billing`,
    });

    return c.json({ url: portalSession.url });
  });
