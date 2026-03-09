import { db } from "@workspace/db/server";
import { affiliate, commission, affiliatePayout } from "@workspace/db/schema";
import { eq, and } from "@workspace/db";
import { generateId } from "@workspace/shared/utils";

// ─── Commission Rates (3-tier) ──────────────────────────────
const TIER_RATES = {
  tier1: 0.20, // 20% — direct referrer
  tier2: 0.08, // 8%  — referrer's parent
  tier3: 0.02, // 2%  — referrer's grandparent
} as const;

// ─── Helpers ─────────────────────────────────────────────────

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += chars[(Math.random() * chars.length) | 0];
  }
  return code;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

function getCurrentPeriodMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Queries ─────────────────────────────────────────────────

export async function getAffiliateByUserId(userId: string) {
  return db.query.affiliate.findFirst({
    where: (t, { eq: eqFn }) => eqFn(t.userId, userId),
  });
}

export async function getAffiliateById(id: string) {
  return db.query.affiliate.findFirst({
    where: (t, { eq: eqFn }) => eqFn(t.id, id),
  });
}

export async function getAffiliateByCode(code: string) {
  return db.query.affiliate.findFirst({
    where: (t, { eq: eqFn }) => eqFn(t.referralCode, code),
  });
}

export async function getAffiliateBySlug(slug: string) {
  return db.query.affiliate.findFirst({
    where: (t, { eq: eqFn }) => eqFn(t.referralSlug, slug),
  });
}

export async function resolveAffiliate(codeOrSlug: string) {
  const byCode = await getAffiliateByCode(codeOrSlug);
  if (byCode) return byCode;
  return getAffiliateBySlug(codeOrSlug);
}

// ─── Activate ────────────────────────────────────────────────

export async function activateAffiliate(
  userId: string,
  userName: string,
  walletAddress?: string,
  parentReferralCode?: string,
) {
  const existing = await getAffiliateByUserId(userId);
  if (existing) return existing;

  const referralCode = generateReferralCode();
  let referralSlug = slugify(userName);

  // Ensure slug uniqueness
  const slugExists = await getAffiliateBySlug(referralSlug);
  if (slugExists) {
    referralSlug = `${referralSlug}-${referralCode.slice(0, 4).toLowerCase()}`;
  }

  // Resolve parent affiliate (who referred this user)
  let parentAffiliateId: string | null = null;
  if (parentReferralCode) {
    const parent = await resolveAffiliate(parentReferralCode);
    if (parent && parent.status === "active") {
      parentAffiliateId = parent.id;
    }
  }

  const [created] = await db
    .insert(affiliate)
    .values({
      id: generateId(),
      userId,
      referralCode,
      referralSlug,
      walletAddress: walletAddress || null,
      parentAffiliateId,
      status: "active",
    })
    .returning();

  return created;
}

// ─── Stats ───────────────────────────────────────────────────

export async function getAffiliateStats(affiliateId: string) {
  const commissions = await db.query.commission.findMany({
    where: (t, { eq: eqFn }) => eqFn(t.affiliateId, affiliateId),
  });

  const pending = commissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + Number(c.commissionAmount), 0);

  const totalEarned = commissions
    .filter((c) => c.status !== "voided")
    .reduce((sum, c) => sum + Number(c.commissionAmount), 0);

  const activeReferrals = new Set(
    commissions
      .filter((c) => c.status !== "voided" && c.tier === "tier1")
      .map((c) => c.referredUserId),
  ).size;

  const paidOut = await db.query.affiliatePayout.findMany({
    where: (t, { eq: eqFn }) => eqFn(t.affiliateId, affiliateId),
  });

  const totalPaid = paidOut
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amountUsdt), 0);

  const available = totalEarned - totalPaid - pending;

  return {
    available: Math.max(0, available),
    pending,
    totalEarned,
    totalPaid,
    activeReferrals,
  };
}

// ─── Commissions (3-tier) ────────────────────────────────────

/**
 * Creates commissions for the entire referral chain (up to 3 tiers).
 * Called when a referred user's payment succeeds.
 *
 * tier1 = 20% → direct referrer
 * tier2 = 8%  → referrer's parent
 * tier3 = 2%  → referrer's grandparent
 */
export async function createCommissionChain(
  referrerAffiliateId: string,
  referredUserId: string,
  stripeInvoiceId: string,
  grossAmount: number,
  currency: string,
) {
  const tiers: Array<{ affiliateId: string; tier: "tier1" | "tier2" | "tier3" }> = [];
  const periodMonth = getCurrentPeriodMonth();

  // Tier 1: direct referrer
  tiers.push({ affiliateId: referrerAffiliateId, tier: "tier1" });

  // Tier 2: referrer's parent
  const tier1Affiliate = await getAffiliateById(referrerAffiliateId);
  if (tier1Affiliate?.parentAffiliateId) {
    const parent = await getAffiliateById(tier1Affiliate.parentAffiliateId);
    if (parent && parent.status === "active") {
      tiers.push({ affiliateId: parent.id, tier: "tier2" });

      // Tier 3: grandparent
      if (parent.parentAffiliateId) {
        const grandparent = await getAffiliateById(parent.parentAffiliateId);
        if (grandparent && grandparent.status === "active") {
          tiers.push({ affiliateId: grandparent.id, tier: "tier3" });
        }
      }
    }
  }

  const created = [];
  for (const { affiliateId, tier } of tiers) {
    const rate = TIER_RATES[tier];
    const commissionAmount = Math.round(grossAmount * rate * 100) / 100;

    const [row] = await db
      .insert(commission)
      .values({
        id: generateId(),
        affiliateId,
        referredUserId,
        stripeInvoiceId,
        grossAmount: String(grossAmount),
        commissionAmount: String(commissionAmount),
        currency,
        tier,
        status: "pending",
        periodMonth,
      })
      .returning();

    created.push(row);
  }

  return created;
}

export async function getCommissions(affiliateId: string, limit = 50, offset = 0) {
  return db.query.commission.findMany({
    where: (t, { eq: eqFn }) => eqFn(t.affiliateId, affiliateId),
    orderBy: (t, { desc: descFn }) => descFn(t.createdAt),
    limit,
    offset,
  });
}

export async function voidCommissionsByInvoice(stripeInvoiceId: string) {
  await db
    .update(commission)
    .set({ status: "voided" })
    .where(
      and(
        eq(commission.stripeInvoiceId, stripeInvoiceId),
        eq(commission.status, "pending"),
      ),
    );
}

export async function restoreCommissionsByInvoice(stripeInvoiceId: string) {
  await db
    .update(commission)
    .set({ status: "pending" })
    .where(
      and(
        eq(commission.stripeInvoiceId, stripeInvoiceId),
        eq(commission.status, "voided"),
      ),
    );
}

export async function voidPendingCommissionsForUser(referredUserId: string) {
  await db
    .update(commission)
    .set({ status: "voided" })
    .where(
      and(
        eq(commission.referredUserId, referredUserId),
        eq(commission.status, "pending"),
      ),
    );
}

// ─── Payouts ─────────────────────────────────────────────────

export async function getPayouts(affiliateId: string) {
  return db.query.affiliatePayout.findMany({
    where: (t, { eq: eqFn }) => eqFn(t.affiliateId, affiliateId),
    orderBy: (t, { desc: descFn }) => descFn(t.createdAt),
  });
}

// ─── Wallet ──────────────────────────────────────────────────

export async function updateWallet(affiliateId: string, walletAddress: string) {
  await db
    .update(affiliate)
    .set({ walletAddress })
    .where(eq(affiliate.id, affiliateId));
}
