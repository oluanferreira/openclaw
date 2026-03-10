import { db } from "@workspace/db/server";
import { affiliate, commission, affiliatePayout } from "@workspace/db/schema";
import { eq, and, sql } from "@workspace/db";
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
      // Anti-fraud: prevent self-referral
      if (parent.userId === userId) {
        console.warn(`[referral] Self-referral blocked: user ${userId} tried own code ${parentReferralCode}`);
      }
      // Anti-fraud: prevent circular chain (A refers B, B refers A)
      else if (parent.parentAffiliateId) {
        const grandparent = await getAffiliateById(parent.parentAffiliateId);
        if (grandparent?.userId === userId) {
          console.warn(`[referral] Circular chain blocked: user ${userId} -> ${parent.id} -> ${grandparent.id}`);
        } else {
          parentAffiliateId = parent.id;
        }
      } else {
        parentAffiliateId = parent.id;
      }
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
  const [commStats] = await db
    .select({
      pending: sql<string>`COALESCE(SUM(CASE WHEN ${commission.status} = 'pending' THEN COALESCE(${commission.commissionAmountUsd}, ${commission.commissionAmount})::numeric ELSE 0 END), 0)::text`,
      totalEarned: sql<string>`COALESCE(SUM(CASE WHEN ${commission.status} != 'voided' THEN COALESCE(${commission.commissionAmountUsd}, ${commission.commissionAmount})::numeric ELSE 0 END), 0)::text`,
      activeReferrals: sql<number>`COUNT(DISTINCT CASE WHEN ${commission.status} != 'voided' AND ${commission.tier} = 'tier1' THEN ${commission.referredUserId} END)::int`,
    })
    .from(commission)
    .where(eq(commission.affiliateId, affiliateId));

  const [payoutStats] = await db
    .select({
      totalPaid: sql<string>`COALESCE(SUM(CASE WHEN ${affiliatePayout.status} = 'paid' THEN ${affiliatePayout.amountUsdt}::numeric ELSE 0 END), 0)::text`,
    })
    .from(affiliatePayout)
    .where(eq(affiliatePayout.affiliateId, affiliateId));

  const pending = Number(commStats?.pending ?? 0);
  const totalEarned = Number(commStats?.totalEarned ?? 0);
  const totalPaid = Number(payoutStats?.totalPaid ?? 0);
  const available = totalEarned - totalPaid - pending;

  return {
    available: Math.max(0, available),
    pending,
    totalEarned,
    totalPaid,
    activeReferrals: commStats?.activeReferrals ?? 0,
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
  usdConversion?: { grossAmountUsd: number; exchangeRate: number } | null,
) {
  const tiers: Array<{ affiliateId: string; tier: "tier1" | "tier2" | "tier3" }> = [];
  const periodMonth = getCurrentPeriodMonth();

  // Anti-fraud: check tier1 affiliate is active
  const tier1Affiliate = await getAffiliateById(referrerAffiliateId);
  if (!tier1Affiliate || tier1Affiliate.status !== "active") {
    console.warn(`[referral] Commission blocked: affiliate ${referrerAffiliateId} not active`);
    return [];
  }

  // Anti-fraud: prevent self-payment commission
  if (tier1Affiliate.userId === referredUserId) {
    console.warn(`[referral] Self-payment blocked: affiliate ${referrerAffiliateId} == referred ${referredUserId}`);
    return [];
  }

  // Anti-fraud: check duplicate (same invoice already processed)
  const existingForInvoice = await db.query.commission.findFirst({
    where: (t, { eq: eqFn, and: andFn }) =>
      andFn(
        eqFn(t.stripeInvoiceId, stripeInvoiceId),
        eqFn(t.affiliateId, referrerAffiliateId),
      ),
  });
  if (existingForInvoice) {
    console.warn(`[referral] Duplicate blocked: invoice ${stripeInvoiceId} already has commission for ${referrerAffiliateId}`);
    return [];
  }

  // Tier 1: direct referrer
  tiers.push({ affiliateId: referrerAffiliateId, tier: "tier1" });

  // Tier 2: referrer's parent
  if (tier1Affiliate.parentAffiliateId) {
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
        grossAmountUsd: usdConversion ? String(usdConversion.grossAmountUsd) : (currency === "usd" ? String(grossAmount) : null),
        commissionAmountUsd: usdConversion
          ? String(Math.round(usdConversion.grossAmountUsd * rate * 100) / 100)
          : (currency === "usd" ? String(commissionAmount) : null),
        exchangeRate: usdConversion ? String(usdConversion.exchangeRate) : (currency === "usd" ? "1" : null),
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


// ─── Network (user dashboard) ────────────────────────────────

type NetworkNode = {
  id: string;
  userName: string | null;
  userEmail: string | null;
  status: string;
  createdAt: Date;
  referralCode: string;
  childrenCount: number;
  children: NetworkNode[];
};

export async function getAffiliateNetwork(affiliateId: string): Promise<NetworkNode[]> {
  // Level 1: direct referrals
  const level1 = await db.query.affiliate.findMany({
    where: (t, { eq: eqFn }) => eqFn(t.parentAffiliateId, affiliateId),
    with: { user: { columns: { name: true, email: true } } },
  });

  const result: NetworkNode[] = [];

  for (const l1 of level1) {
    // Level 2: sub-referrals of each direct
    const level2 = await db.query.affiliate.findMany({
      where: (t, { eq: eqFn }) => eqFn(t.parentAffiliateId, l1.id),
      with: { user: { columns: { name: true, email: true } } },
    });

    const l2Nodes: NetworkNode[] = [];
    for (const l2 of level2) {
      // Level 3: sub-sub-referrals
      const level3 = await db.query.affiliate.findMany({
        where: (t, { eq: eqFn }) => eqFn(t.parentAffiliateId, l2.id),
        with: { user: { columns: { name: true, email: true } } },
      });

      const l3Nodes: NetworkNode[] = level3.map((l3) => ({
        id: l3.id,
        userName: l3.user?.name ?? null,
        userEmail: l3.user?.email ?? null,
        status: l3.status,
        createdAt: l3.createdAt,
        referralCode: l3.referralCode,
        childrenCount: 0,
        children: [],
      }));

      l2Nodes.push({
        id: l2.id,
        userName: l2.user?.name ?? null,
        userEmail: l2.user?.email ?? null,
        status: l2.status,
        createdAt: l2.createdAt,
        referralCode: l2.referralCode,
        childrenCount: l3Nodes.length,
        children: l3Nodes,
      });
    }

    result.push({
      id: l1.id,
      userName: l1.user?.name ?? null,
      userEmail: l1.user?.email ?? null,
      status: l1.status,
      createdAt: l1.createdAt,
      referralCode: l1.referralCode,
      childrenCount: 0, // calculated below
      children: l2Nodes,
    });
  }

  // Fix childrenCount for level 1 nodes
  for (const node of result) {
    node.childrenCount = countAllDescendants(node);
  }

  return result;
}

function countAllDescendants(node: NetworkNode): number {
  let count = node.children.length;
  for (const child of node.children) {
    count += countAllDescendants(child);
  }
  return count;
}
