import { Hono } from "hono";
import { z } from "zod";

import { db } from "@workspace/db/server";
import { HttpStatusCode } from "@workspace/shared/constants";
import { HttpException } from "@workspace/shared/utils";

import { enforceAuth } from "../../middleware";

import {
  acceptTerms,
  activateAffiliate,
  getAffiliateByUserId,
  getAffiliateNetwork,
  getAffiliateStats,
  getCommissions,
  getPayouts,
  resolveAffiliate,
  updateWallet,
} from "./service";

const BEP20_REGEX = /^0x[a-fA-F0-9]{40}$/;

const activateSchema = z.object({
  walletAddress: z.string().regex(BEP20_REGEX, "Invalid BEP20 wallet address"),
  acceptedTerms: z.literal(true, {
    message: "You must accept the referral terms",
  }),
  parentReferralCode: z.string().optional(),
});

const walletSchema = z.object({
  walletAddress: z.string().regex(BEP20_REGEX, "Invalid BEP20 wallet address"),
});

export const referralRouter = new Hono()
  // Public: resolve referral code/slug (used by tracking middleware)
  .get("/resolve/:ref", async (c) => {
    const ref = c.req.param("ref");
    const aff = await resolveAffiliate(ref);
    if (aff?.status !== "active") {
      return c.json({ valid: false });
    }
    return c.json({ valid: true, code: aff.referralCode });
  })
  // All routes below require auth
  .use(enforceAuth)
  // Activate referral program
  .post("/activate", async (c) => {
    const user = c.var.user;

    // Only admin accounts can activate without an active subscription
    const ADMIN_EMAILS = [
      "luanferreira.emp@gmail.com",
      "luizjuniorbjj@gmail.com",
    ];
    if (!ADMIN_EMAILS.includes(user.email)) {
      const sub = await db.query.subscription.findFirst({
        where: (t, { eq: eqFn }) => eqFn(t.userId, user.id),
      });
      if (sub?.status !== "active") {
        throw new HttpException(HttpStatusCode.PAYMENT_REQUIRED, {
          code: "billing:subscription.required",
        });
      }
    }

    const raw: unknown = await c.req.json();
    const body = activateSchema.parse(raw);

    const aff = await activateAffiliate(
      user.id,
      user.name,
      body.walletAddress,
      body.parentReferralCode,
    );
    return c.json(aff, HttpStatusCode.CREATED);
  })
  // Get my affiliate data
  .get("/me", async (c) => {
    const user = c.var.user;
    const aff = await getAffiliateByUserId(user.id);

    if (!aff) {
      return c.json({ active: false });
    }

    const stats = await getAffiliateStats(aff.id);

    return c.json({
      active: true,
      referralCode: aff.referralCode,
      referralSlug: aff.referralSlug,
      walletAddress: aff.walletAddress,
      status: aff.status,
      activatedAt: aff.activatedAt,
      termsAcceptedAt: aff.termsAcceptedAt,
      stats,
    });
  })
  // Get my commissions
  .get("/commissions", async (c) => {
    const user = c.var.user;
    const aff = await getAffiliateByUserId(user.id);

    if (!aff) {
      throw new HttpException(HttpStatusCode.NOT_FOUND, {
        code: "referral:notActive",
      });
    }

    const limit = Number(c.req.query("limit") ?? 50);
    const offset = Number(c.req.query("offset") ?? 0);
    const items = await getCommissions(aff.id, limit, offset);

    return c.json({ items });
  })
  // Get my payouts
  .get("/payouts", async (c) => {
    const user = c.var.user;
    const aff = await getAffiliateByUserId(user.id);

    if (!aff) {
      throw new HttpException(HttpStatusCode.NOT_FOUND, {
        code: "referral:notActive",
      });
    }

    const items = await getPayouts(aff.id);
    return c.json({ items });
  })
  // Get my referral network (up to 3 levels deep)
  .get("/network", async (c) => {
    const user = c.var.user;
    const aff = await getAffiliateByUserId(user.id);

    if (!aff) {
      throw new HttpException(HttpStatusCode.NOT_FOUND, {
        code: "referral:notActive",
      });
    }

    const items = await getAffiliateNetwork(aff.id);
    return c.json({ items });
  })
  // Accept referral terms
  .put("/accept-terms", async (c) => {
    const user = c.var.user;
    const result = await acceptTerms(user.id);

    if (!result) {
      throw new HttpException(HttpStatusCode.NOT_FOUND, {
        code: "referral:notActive",
      });
    }

    return c.json({ ok: true, termsAcceptedAt: result.termsAcceptedAt });
  })
  // Update wallet address
  .put("/wallet", async (c) => {
    const user = c.var.user;
    const aff = await getAffiliateByUserId(user.id);

    if (!aff) {
      throw new HttpException(HttpStatusCode.NOT_FOUND, {
        code: "referral:notActive",
      });
    }

    const raw: unknown = await c.req.json();
    const body = walletSchema.parse(raw);
    await updateWallet(aff.id, body.walletAddress);

    return c.json({ ok: true });
  });
