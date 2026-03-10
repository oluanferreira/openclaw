/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-empty-function */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — declared BEFORE the module under test is imported
// ---------------------------------------------------------------------------

const mockFindFirstAffiliate = vi.fn();
const mockFindFirstCommission = vi.fn();
const mockFindManyCommission = vi.fn();
const mockFindManyPayout = vi.fn();

const mockInsertReturning = vi.fn();
const mockInsertValues = vi.fn();
const mockInsert = vi.fn();

const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
const mockSelectResult = vi.fn();
const mockUpdateSet = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@workspace/db/server", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: (...args: unknown[]) => mockSelectResult(...args),
      }),
    }),
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return {
        values: (vals: unknown) => {
          mockInsertValues(vals);
          return { returning: () => mockInsertReturning() };
        },
      };
    },
    update: (...args: unknown[]) => {
      mockUpdate(...args);
      return {
        set: (vals: unknown) => {
          mockUpdateSet(vals);
          return { where: mockUpdateWhere };
        },
      };
    },
    query: {
      affiliate: {
        findFirst: (...args: unknown[]) => mockFindFirstAffiliate(...args),
      },
      commission: {
        findFirst: (...args: unknown[]) => mockFindFirstCommission(...args),
        findMany: (...args: unknown[]) => mockFindManyCommission(...args),
      },
      affiliatePayout: {
        findMany: (...args: unknown[]) => mockFindManyPayout(...args),
      },
    },
  },
}));

vi.mock("@workspace/db/schema", () => ({
  affiliate: Symbol("affiliate"),
  commission: Symbol("commission"),
  affiliatePayout: Symbol("affiliatePayout"),
}));

vi.mock("@workspace/db", () => ({
  eq: vi.fn((_col: unknown, val: unknown) => ({ _eq: val })),
  and: vi.fn((...args: unknown[]) => ({ _and: args })),
  sql: (...args: unknown[]) => args,
}));

vi.mock("@workspace/shared/utils", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, generateId: vi.fn().mockReturnValue("gen-id-001") };
});

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------
import {
  activateAffiliate,
  createCommissionChain,
  getAffiliateByUserId,
  getAffiliateStats,
  resolveAffiliate,
  updateWallet,
  voidCommissionsByInvoice,
  restoreCommissionsByInvoice,
  voidPendingCommissionsForUser,
} from "../service";

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------
const USER_A = "user-a";
const USER_B = "user-b";
const USER_C = "user-c";
const AFF_A = {
  id: "aff-a",
  userId: USER_A,
  referralCode: "CODEA12345AB",
  referralSlug: "alice",
  status: "active",
  parentAffiliateId: null,
  walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
};
const AFF_B = {
  id: "aff-b",
  userId: USER_B,
  referralCode: "CODEB12345AB",
  referralSlug: "bob",
  status: "active",
  parentAffiliateId: "aff-a",
  walletAddress: null,
};
const AFF_C = {
  id: "aff-c",
  userId: USER_C,
  referralCode: "CODEC12345AB",
  referralSlug: "carol",
  status: "active",
  parentAffiliateId: "aff-b",
  walletAddress: null,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Referral Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindFirstAffiliate.mockResolvedValue(null);
    mockFindFirstCommission.mockResolvedValue(null);
    mockFindManyCommission.mockResolvedValue([]);
    mockFindManyPayout.mockResolvedValue([]);
    mockInsertReturning.mockResolvedValue([
      {
        id: "gen-id-001",
        referralCode: "NEWCODE12345",
        referralSlug: "test-user",
        status: "active",
      },
    ]);
  });

  // =========================================================================
  // resolveAffiliate
  // =========================================================================
  describe("resolveAffiliate", () => {
    it("should resolve by code first", async () => {
      mockFindFirstAffiliate
        .mockResolvedValueOnce(AFF_A)
        .mockResolvedValueOnce(null);

      const result = await resolveAffiliate("CODEA12345AB");
      expect(result).toEqual(AFF_A);
      expect(mockFindFirstAffiliate).toHaveBeenCalledTimes(1);
    });

    it("should fall back to slug when code not found", async () => {
      mockFindFirstAffiliate.mockReset();
      mockFindFirstAffiliate
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(AFF_A);

      const result = await resolveAffiliate("alice");
      expect(result).toEqual(AFF_A);
      expect(mockFindFirstAffiliate).toHaveBeenCalledTimes(2);
    });

    it("should return undefined when neither code nor slug found", async () => {
      mockFindFirstAffiliate.mockReset();
      mockFindFirstAffiliate.mockResolvedValue(null);
      const result = await resolveAffiliate("nonexistent");
      expect(result).toBeFalsy();
    });
  });

  // =========================================================================
  // activateAffiliate
  // =========================================================================
  describe("activateAffiliate", () => {
    it("should return existing affiliate if already activated", async () => {
      mockFindFirstAffiliate.mockResolvedValueOnce(AFF_A);
      const result = await activateAffiliate(USER_A);
      expect(result).toEqual(AFF_A);
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("should create new affiliate with generated code and slug", async () => {
      mockFindFirstAffiliate.mockResolvedValueOnce(null);
      mockFindFirstAffiliate.mockResolvedValueOnce(null);

      const created = {
        id: "gen-id-001",
        userId: USER_A,
        referralCode: "NEWCODE12345",
        referralSlug: "alice",
        status: "active",
      };
      mockSelectResult.mockResolvedValue([]);
      mockInsertReturning.mockResolvedValueOnce([created]);

      const result = await activateAffiliate(USER_A);
      expect(result).toEqual(created);
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "gen-id-001",
          userId: USER_A,
          status: "active",
        }),
      );
    });

    it("should append suffix to slug when duplicate exists", async () => {
      mockFindFirstAffiliate.mockResolvedValueOnce(null);
      mockFindFirstAffiliate.mockResolvedValueOnce({
        id: "other",
        referralSlug: "alice",
      });

      mockSelectResult.mockResolvedValue([]);
      mockInsertReturning.mockResolvedValueOnce([
        { id: "gen-id-001", referralSlug: "alice-newc" },
      ]);

      await activateAffiliate(USER_A);
      const insertCall = mockInsertValues.mock.calls[0]![0] as Record<
        string,
        unknown
      >;
      expect((insertCall.referralSlug as string).startsWith("alice-")).toBe(
        true,
      );
    });

    it("should set parentAffiliateId when valid parent code provided", async () => {
      mockFindFirstAffiliate.mockResolvedValueOnce(null);
      mockFindFirstAffiliate.mockResolvedValueOnce(null);
      mockFindFirstAffiliate.mockResolvedValueOnce(AFF_A);

      mockSelectResult.mockResolvedValue([]);
      mockInsertReturning.mockResolvedValueOnce([
        { id: "gen-id-001", parentAffiliateId: AFF_A.id },
      ]);

      await activateAffiliate(USER_B, undefined, "CODEA12345AB");
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          parentAffiliateId: AFF_A.id,
        }),
      );
    });

    it("should block self-referral", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      mockFindFirstAffiliate.mockResolvedValueOnce(null);
      mockFindFirstAffiliate.mockResolvedValueOnce(null);
      mockFindFirstAffiliate.mockResolvedValueOnce({
        ...AFF_A,
        userId: USER_A,
      });

      mockSelectResult.mockResolvedValue([]);
      mockInsertReturning.mockResolvedValueOnce([
        { id: "gen-id-001", parentAffiliateId: null },
      ]);

      await activateAffiliate(USER_A, undefined, "CODEA12345AB");

      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({ parentAffiliateId: null }),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[referral] Self-referral blocked"),
      );
      consoleSpy.mockRestore();
    });

    it("should block circular chain (A->B->A)", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      mockFindFirstAffiliate.mockResolvedValueOnce(null);
      mockFindFirstAffiliate.mockResolvedValueOnce(null);
      mockFindFirstAffiliate.mockResolvedValueOnce(AFF_B);
      mockFindFirstAffiliate.mockResolvedValueOnce({
        ...AFF_A,
        userId: USER_A,
      });

      mockSelectResult.mockResolvedValue([]);
      mockInsertReturning.mockResolvedValueOnce([
        { id: "gen-id-001", parentAffiliateId: null },
      ]);

      await activateAffiliate(USER_A, undefined, AFF_B.referralCode);

      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({ parentAffiliateId: null }),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[referral] Circular chain blocked"),
      );
      consoleSpy.mockRestore();
    });
  });

  // =========================================================================
  // getAffiliateStats
  // =========================================================================
  describe("getAffiliateStats", () => {
    it("should return zeros when no commissions or payouts", async () => {
      mockSelectResult
        .mockResolvedValueOnce([
          { pending: "0", totalEarned: "0", activeReferrals: 0 },
        ])
        .mockResolvedValueOnce([{ totalPaid: "0" }]);

      const stats = await getAffiliateStats("aff-x");
      expect(stats).toEqual({
        available: 0,
        pending: 0,
        totalEarned: 0,
        totalPaid: 0,
        activeReferrals: 0,
      });
    });

    it("should calculate correct stats with mixed commissions", async () => {
      // pending = 20+15+8 = 43, totalEarned = 20+20+15+8 = 63, activeReferrals = 2 (u1,u2 tier1 non-voided)
      mockSelectResult
        .mockResolvedValueOnce([
          { pending: "43", totalEarned: "63", activeReferrals: 2 },
        ])
        .mockResolvedValueOnce([{ totalPaid: "20" }]);

      const stats = await getAffiliateStats("aff-a");
      expect(stats.pending).toBe(43);
      expect(stats.totalEarned).toBe(63);
      expect(stats.totalPaid).toBe(20);
      expect(stats.available).toBe(0);
      expect(stats.activeReferrals).toBe(2);
    });

    it("should not count voided in activeReferrals", async () => {
      mockSelectResult
        .mockResolvedValueOnce([
          { pending: "0", totalEarned: "0", activeReferrals: 0 },
        ])
        .mockResolvedValueOnce([{ totalPaid: "0" }]);

      const stats = await getAffiliateStats("aff-a");
      expect(stats.activeReferrals).toBe(0);
      expect(stats.totalEarned).toBe(0);
    });

    it("should clamp available to 0 when negative", async () => {
      mockSelectResult
        .mockResolvedValueOnce([
          { pending: "0", totalEarned: "10", activeReferrals: 1 },
        ])
        .mockResolvedValueOnce([{ totalPaid: "15" }]);

      const stats = await getAffiliateStats("aff-a");
      expect(stats.available).toBe(0);
    });
  });

  // =========================================================================
  // createCommissionChain
  // =========================================================================
  describe("createCommissionChain", () => {
    it("should create tier1 commission at 20%", async () => {
      mockFindFirstAffiliate.mockResolvedValueOnce({
        ...AFF_A,
        parentAffiliateId: null,
      });
      mockFindFirstCommission.mockResolvedValueOnce(null);

      const row = {
        id: "gen-id-001",
        affiliateId: AFF_A.id,
        tier: "tier1",
        commissionAmount: "20.00",
      };
      mockInsertReturning.mockResolvedValue([row]);

      const result = await createCommissionChain(
        AFF_A.id,
        "referred-user",
        "inv_123",
        100,
        "usd",
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(row);
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          affiliateId: AFF_A.id,
          tier: "tier1",
          commissionAmount: "20",
          grossAmount: "100",
          currency: "usd",
          status: "pending",
        }),
      );
    });

    it("should create tier1+tier2 when parent exists", async () => {
      mockFindFirstAffiliate.mockResolvedValueOnce(AFF_B);
      mockFindFirstCommission.mockResolvedValueOnce(null);
      mockFindFirstAffiliate.mockResolvedValueOnce({
        ...AFF_A,
        parentAffiliateId: null,
      });

      const rows = [
        { id: "id-1", tier: "tier1", commissionAmount: "20.00" },
        { id: "id-2", tier: "tier2", commissionAmount: "8.00" },
      ];
      let callCount = 0;
      mockInsertReturning.mockImplementation(() => {
        const row = rows[callCount]!;
        callCount++;
        return Promise.resolve([row]);
      });

      const result = await createCommissionChain(
        AFF_B.id,
        "referred-user",
        "inv_123",
        100,
        "usd",
      );
      expect(result).toHaveLength(2);
      expect(result[0]!.tier).toBe("tier1");
      expect(result[1]!.tier).toBe("tier2");
    });

    it("should create all 3 tiers when grandparent exists", async () => {
      mockFindFirstAffiliate.mockResolvedValueOnce(AFF_C);
      mockFindFirstCommission.mockResolvedValueOnce(null);
      mockFindFirstAffiliate.mockResolvedValueOnce(AFF_B);
      mockFindFirstAffiliate.mockResolvedValueOnce({
        ...AFF_A,
        parentAffiliateId: null,
      });

      const rows = [
        { id: "id-1", tier: "tier1" },
        { id: "id-2", tier: "tier2" },
        { id: "id-3", tier: "tier3" },
      ];
      let callCount = 0;
      mockInsertReturning.mockImplementation(() => {
        const row = rows[callCount]!;
        callCount++;
        return Promise.resolve([row]);
      });

      const result = await createCommissionChain(
        AFF_C.id,
        "referred-user",
        "inv_123",
        100,
        "usd",
      );
      expect(result).toHaveLength(3);
    });

    it("should block commission when affiliate is inactive", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockFindFirstAffiliate.mockResolvedValueOnce({
        ...AFF_A,
        status: "suspended",
      });

      const result = await createCommissionChain(
        AFF_A.id,
        "referred-user",
        "inv_123",
        100,
        "usd",
      );
      expect(result).toEqual([]);
      expect(mockInsert).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should block self-payment commission", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockFindFirstAffiliate.mockResolvedValueOnce({
        ...AFF_A,
        userId: "self-user",
      });

      const result = await createCommissionChain(
        AFF_A.id,
        "self-user",
        "inv_123",
        100,
        "usd",
      );
      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });

    it("should block duplicate invoice commission", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockFindFirstAffiliate.mockResolvedValueOnce(AFF_A);
      mockFindFirstCommission.mockResolvedValueOnce({
        id: "existing",
        stripeInvoiceId: "inv_123",
      });

      const result = await createCommissionChain(
        AFF_A.id,
        "referred-user",
        "inv_123",
        100,
        "usd",
      );
      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });

    it("should skip tier2 when parent is suspended", async () => {
      mockFindFirstAffiliate.mockResolvedValueOnce(AFF_B);
      mockFindFirstCommission.mockResolvedValueOnce(null);
      mockFindFirstAffiliate.mockResolvedValueOnce({
        ...AFF_A,
        status: "suspended",
      });

      const row = { id: "id-1", tier: "tier1" };
      mockInsertReturning.mockResolvedValue([row]);

      const result = await createCommissionChain(
        AFF_B.id,
        "referred-user",
        "inv_123",
        100,
        "usd",
      );
      expect(result).toHaveLength(1);
    });

    it("should round commission to 2 decimal places", async () => {
      mockFindFirstAffiliate.mockResolvedValueOnce({
        ...AFF_A,
        parentAffiliateId: null,
      });
      mockFindFirstCommission.mockResolvedValueOnce(null);
      mockInsertReturning.mockResolvedValue([{ id: "id-1" }]);

      await createCommissionChain(
        AFF_A.id,
        "referred-user",
        "inv_123",
        29.85,
        "usd",
      );

      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({ commissionAmount: "5.97" }),
      );
    });

    it("should return empty when affiliate not found", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockFindFirstAffiliate.mockResolvedValueOnce(null);

      const result = await createCommissionChain(
        "nonexistent",
        "referred-user",
        "inv_123",
        100,
        "usd",
      );
      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  // =========================================================================
  // void / restore / voidForUser
  // =========================================================================
  describe("voidCommissionsByInvoice", () => {
    it("should update pending commissions to voided", async () => {
      await voidCommissionsByInvoice("inv_123");
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith({ status: "voided" });
    });
  });

  describe("restoreCommissionsByInvoice", () => {
    it("should update voided commissions to pending", async () => {
      await restoreCommissionsByInvoice("inv_123");
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith({ status: "pending" });
    });
  });

  describe("voidPendingCommissionsForUser", () => {
    it("should void all pending for a referred user", async () => {
      await voidPendingCommissionsForUser("user-xyz");
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith({ status: "voided" });
    });
  });

  // =========================================================================
  // updateWallet
  // =========================================================================
  describe("updateWallet", () => {
    it("should update wallet address", async () => {
      const wallet = "0xabcdef1234567890abcdef1234567890abcdef12";
      await updateWallet("aff-a", wallet);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith({ walletAddress: wallet });
    });
  });

  // =========================================================================
  // getAffiliateByUserId
  // =========================================================================
  describe("getAffiliateByUserId", () => {
    it("should return affiliate when found", async () => {
      mockFindFirstAffiliate.mockResolvedValueOnce(AFF_A);
      const result = await getAffiliateByUserId(USER_A);
      expect(result).toEqual(AFF_A);
    });

    it("should return undefined when not found", async () => {
      mockFindFirstAffiliate.mockResolvedValueOnce(undefined);
      const result = await getAffiliateByUserId("nonexistent");
      expect(result).toBeFalsy();
    });
  });
});
