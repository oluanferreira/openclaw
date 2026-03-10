/* eslint-disable @typescript-eslint/no-unsafe-return */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — declared BEFORE the module under test is imported
// ---------------------------------------------------------------------------

const mockResolveAffiliate = vi.fn();
const mockActivateAffiliate = vi.fn();
const mockGetAffiliateByUserId = vi.fn();
const mockGetAffiliateStats = vi.fn();
const mockGetCommissions = vi.fn();
const mockGetPayouts = vi.fn();
const mockUpdateWallet = vi.fn();

vi.mock("../service", () => ({
  resolveAffiliate: (...args: unknown[]) => mockResolveAffiliate(...args),
  activateAffiliate: (...args: unknown[]) => mockActivateAffiliate(...args),
  getAffiliateByUserId: (...args: unknown[]) => mockGetAffiliateByUserId(...args),
  getAffiliateStats: (...args: unknown[]) => mockGetAffiliateStats(...args),
  getCommissions: (...args: unknown[]) => mockGetCommissions(...args),
  getPayouts: (...args: unknown[]) => mockGetPayouts(...args),
  updateWallet: (...args: unknown[]) => mockUpdateWallet(...args),
}));

vi.mock("@workspace/shared/constants", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    HttpStatusCode: { BAD_REQUEST: 400, NOT_FOUND: 404, CREATED: 201, PAYMENT_REQUIRED: 402 },
  };
});

vi.mock("@workspace/shared/utils", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    HttpException: class HttpException extends Error {
      status: number;
      code?: string;
      constructor(status?: number, options?: { code?: string; message?: string }) {
        super(options?.message ?? `HTTP ${status}`);
        this.status = status ?? 500;
        this.code = options?.code;
      }
    },
  };
});

// Mock middleware — enforceAuth injects c.var.user, enforceSubscription is no-op
const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };

vi.mock("../../../middleware", () => ({
  enforceAuth: vi.fn((c: { set: (key: string, val: unknown) => void }, next: () => Promise<void>) => {
    c.set("user", mockUser);
    return next();
  }),
  enforceSubscription: vi.fn((_c: unknown, next: () => Promise<void>) => next()),
}));


// Mock db for subscription check in activate route (non-admin users)
const mockSubscriptionFindFirst = vi.fn();
vi.mock("@workspace/db/server", () => ({
  db: {
    query: {
      subscription: {
        findFirst: (...args: unknown[]) => mockSubscriptionFindFirst(...args),
      },
    },
  },
}));
// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------
import { referralRouter } from "../router";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function sendRequest(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<Response> {
  const options: RequestInit = { method, headers: { "content-type": "application/json" } };
  if (body) options.body = JSON.stringify(body);
  return referralRouter.fetch(new Request(`http://localhost${path}`, options));
}

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------
const AFF = {
  id: "aff-123",
  userId: "user-123",
  referralCode: "TESTCODE1234",
  referralSlug: "test-user",
  walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
  status: "active",
  activatedAt: new Date().toISOString(),
};

const STATS = {
  available: 50,
  pending: 30,
  totalEarned: 100,
  totalPaid: 20,
  activeReferrals: 3,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Referral Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // GET /resolve/:ref
  // =========================================================================
  describe("GET /resolve/:ref", () => {
    it("should return valid=true when affiliate found and active", async () => {
      mockResolveAffiliate.mockResolvedValueOnce(AFF);

      const res = await sendRequest("GET", "/resolve/TESTCODE1234");
      expect(res.status).toBe(200);

      const json = (await res.json()) as Record<string, unknown>;
      expect(json).toEqual({ valid: true, code: AFF.referralCode });
    });

    it("should return valid=false when affiliate not found", async () => {
      mockResolveAffiliate.mockResolvedValueOnce(null);

      const res = await sendRequest("GET", "/resolve/NONEXISTENT");
      expect(res.status).toBe(200);

      const json = (await res.json()) as Record<string, unknown>;
      expect(json).toEqual({ valid: false });
    });

    it("should return valid=false when affiliate is suspended", async () => {
      mockResolveAffiliate.mockResolvedValueOnce({ ...AFF, status: "suspended" });

      const res = await sendRequest("GET", "/resolve/TESTCODE1234");
      expect(res.status).toBe(200);

      const json = (await res.json()) as Record<string, unknown>;
      expect(json).toEqual({ valid: false });
    });
  });

  // =========================================================================
  // POST /activate
  // =========================================================================
  describe("POST /activate", () => {
    it("should activate affiliate with valid BEP20 wallet", async () => {
      mockSubscriptionFindFirst.mockResolvedValueOnce({ status: "active" });
      mockActivateAffiliate.mockResolvedValueOnce(AFF);

      const res = await sendRequest("POST", "/activate", {
        walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
        acceptedTerms: true,
      });
      expect(res.status).toBe(201);

      const json = (await res.json()) as Record<string, unknown>;
      expect(json.id).toBe(AFF.id);
    });

    it("should reject invalid BEP20 wallet address", async () => {
      const res = await sendRequest("POST", "/activate", {
        walletAddress: "not-a-wallet",
        acceptedTerms: true,
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("should reject when terms not accepted", async () => {
      const res = await sendRequest("POST", "/activate", {
        walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
        acceptedTerms: false,
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("should pass parentReferralCode when provided", async () => {
      mockSubscriptionFindFirst.mockResolvedValueOnce({ status: "active" });
      mockActivateAffiliate.mockResolvedValueOnce(AFF);

      await sendRequest("POST", "/activate", {
        walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
        acceptedTerms: true,
        parentReferralCode: "PARENT123456",
      });

      expect(mockActivateAffiliate).toHaveBeenCalledWith(
        "user-123",
        "Test User",
        "0xabcdef1234567890abcdef1234567890abcdef12",
        "PARENT123456",
      );
    });


    it("should reject non-admin user without active subscription", async () => {
      mockSubscriptionFindFirst.mockResolvedValueOnce(null);

      const res = await sendRequest("POST", "/activate", {
        walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
        acceptedTerms: true,
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // =========================================================================
  // GET /me
  // =========================================================================
  describe("GET /me", () => {
    it("should return active=false when not activated", async () => {
      mockGetAffiliateByUserId.mockResolvedValueOnce(null);

      const res = await sendRequest("GET", "/me");
      expect(res.status).toBe(200);

      const json = (await res.json()) as Record<string, unknown>;
      expect(json).toEqual({ active: false });
    });

    it("should return affiliate data with stats when active", async () => {
      mockGetAffiliateByUserId.mockResolvedValueOnce(AFF);
      mockGetAffiliateStats.mockResolvedValueOnce(STATS);

      const res = await sendRequest("GET", "/me");
      expect(res.status).toBe(200);

      const json = (await res.json()) as Record<string, unknown>;
      expect(json.active).toBe(true);
      expect(json.referralCode).toBe(AFF.referralCode);
      expect(json.referralSlug).toBe(AFF.referralSlug);
      expect(json.stats).toEqual(STATS);
    });
  });

  // =========================================================================
  // GET /commissions
  // =========================================================================
  describe("GET /commissions", () => {
    it("should return commissions list", async () => {
      mockGetAffiliateByUserId.mockResolvedValueOnce(AFF);
      const items = [{ id: "c1", tier: "tier1", commissionAmount: "20.00" }];
      mockGetCommissions.mockResolvedValueOnce(items);

      const res = await sendRequest("GET", "/commissions");
      expect(res.status).toBe(200);

      const json = (await res.json()) as Record<string, unknown>;
      expect(json.items).toEqual(items);
    });

    it("should throw 404 when not activated", async () => {
      mockGetAffiliateByUserId.mockResolvedValueOnce(null);

      const res = await sendRequest("GET", "/commissions");
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("should pass limit and offset query params", async () => {
      mockGetAffiliateByUserId.mockResolvedValueOnce(AFF);
      mockGetCommissions.mockResolvedValueOnce([]);

      await sendRequest("GET", "/commissions?limit=10&offset=20");

      expect(mockGetCommissions).toHaveBeenCalledWith(AFF.id, 10, 20);
    });
  });

  // =========================================================================
  // GET /payouts
  // =========================================================================
  describe("GET /payouts", () => {
    it("should return payouts list", async () => {
      mockGetAffiliateByUserId.mockResolvedValueOnce(AFF);
      const items = [{ id: "p1", amountUsdt: "50.00", status: "paid" }];
      mockGetPayouts.mockResolvedValueOnce(items);

      const res = await sendRequest("GET", "/payouts");
      expect(res.status).toBe(200);

      const json = (await res.json()) as Record<string, unknown>;
      expect(json.items).toEqual(items);
    });

    it("should throw 404 when not activated", async () => {
      mockGetAffiliateByUserId.mockResolvedValueOnce(null);

      const res = await sendRequest("GET", "/payouts");
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // =========================================================================
  // PUT /wallet
  // =========================================================================
  describe("PUT /wallet", () => {
    it("should update wallet with valid BEP20 address", async () => {
      mockGetAffiliateByUserId.mockResolvedValueOnce(AFF);
      mockUpdateWallet.mockResolvedValueOnce(undefined);

      const newWallet = "0x1111111111111111111111111111111111111111";
      const res = await sendRequest("PUT", "/wallet", {
        walletAddress: newWallet,
      });
      expect(res.status).toBe(200);

      const json = (await res.json()) as Record<string, unknown>;
      expect(json).toEqual({ ok: true });
      expect(mockUpdateWallet).toHaveBeenCalledWith(AFF.id, newWallet);
    });

    it("should reject invalid wallet address", async () => {
      mockGetAffiliateByUserId.mockResolvedValueOnce(AFF);

      const res = await sendRequest("PUT", "/wallet", {
        walletAddress: "invalid",
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("should throw 404 when not activated", async () => {
      mockGetAffiliateByUserId.mockResolvedValueOnce(null);

      const res = await sendRequest("PUT", "/wallet", {
        walletAddress: "0x1111111111111111111111111111111111111111",
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
