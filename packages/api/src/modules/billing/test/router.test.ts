/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type Stripe from "stripe";

// ---------------------------------------------------------------------------
// Mocks — declared BEFORE the module under test is imported
// ---------------------------------------------------------------------------

// -- Stripe --
const mockConstructEvent = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();

vi.mock("stripe", () => {
  class StripeMock {
    webhooks = { constructEvent: mockConstructEvent };
    subscriptions = { retrieve: mockSubscriptionsRetrieve };

    constructor(_key: string) {
      // Intentionally empty — mock constructor
    }
  }
  return { default: StripeMock, Stripe: StripeMock };
});

// -- Database --
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockFindFirst = vi.fn();

const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
const mockValues = vi
  .fn()
  .mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
const mockSetReturnsWhere = vi.fn().mockResolvedValue(undefined);
const mockSet = vi.fn().mockReturnValue({ where: mockSetReturnsWhere });

vi.mock("@workspace/db/server", () => ({
  db: {
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return { values: mockValues };
    },
    update: (...args: unknown[]) => {
      mockUpdate(...args);
      return { set: mockSet };
    },
    query: {
      subscription: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
  },
}));

vi.mock("@workspace/db/schema", () => ({
  subscription: Symbol("subscription"),
}));

vi.mock("@workspace/db", () => ({
  eq: vi.fn((_col: unknown, val: unknown) => ({ _eq: val })),
}));

// -- Shared utils --
vi.mock("@workspace/shared/utils", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    generateId: vi.fn().mockReturnValue("generated-id-123"),
    HttpException: class HttpException extends Error {
      status: number;
      code?: string;
      constructor(
        status?: number,
        options?: { code?: string; message?: string },
      ) {
        super(options?.message ?? `HTTP ${status}`);
        this.status = status ?? 500;
        this.code = options?.code;
      }
    },
  };
});

vi.mock("@workspace/shared/constants", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    HttpStatusCode: { BAD_REQUEST: 400, NOT_FOUND: 404 },
  };
});

vi.mock("@workspace/shared/logger", () => ({
  logger: { error: vi.fn() },
}));

// -- OpenClaw server operations --
const mockGetInstanceByUserId = vi.fn();
const mockDeleteInstance = vi.fn();
const mockNotifyAgent = vi.fn();
const mockDestroyInstanceFull = vi.fn();

vi.mock("@workspace/openclaw/server", () => ({
  getInstanceByUserId: (...args: unknown[]) => mockGetInstanceByUserId(...args),
  deleteInstance: (...args: unknown[]) => mockDeleteInstance(...args),
  notifyAgent: (...args: unknown[]) => mockNotifyAgent(...args),
  destroyInstanceFull: (...args: unknown[]) => mockDestroyInstanceFull(...args),
}));

// -- Env (relative to test file: test/ -> billing/ -> modules/ -> src/env) --
vi.mock("../../../env", () => ({
  env: {
    STRIPE_SECRET_KEY: "sk_test_fake",
    STRIPE_WEBHOOK_SECRET: "whsec_test_fake",
    STRIPE_PRICE_ID: "price_test_fake",
    URL: "https://clawin1click.com",
  },
}));

// -- Middleware (relative to test file: test/ -> billing/ -> modules/ -> src/middleware) --
vi.mock("../../../middleware", () => ({
  enforceAuth: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Import the router AFTER mocks are set up
// ---------------------------------------------------------------------------
// eslint-disable-next-line import/order
import { billingRouter } from "../router";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal Hono app and send a POST /webhook request. */
async function sendWebhook(
  body: string,
  signature = "valid-sig",
): Promise<Response> {
  const req = new Request("http://localhost/webhook", {
    method: "POST",
    headers: {
      "stripe-signature": signature,
      "content-type": "application/json",
    },
    body,
  });

  return billingRouter.fetch(req);
}

/** Shorthand to build a Stripe event object for the webhook handler. */
function makeEvent<T>(type: string, data: T): Stripe.Event {
  return {
    id: `evt_test_${Date.now()}`,
    object: "event",
    api_version: "2024-12-18.acacia",
    created: Math.floor(Date.now() / 1000),
    type,
    data: { object: data },
    livemode: false,
    pending_webhooks: 0,
    request: null,
  } as unknown as Stripe.Event;
}

const CUSTOMER_ID = "cus_test_123";
const USER_ID = "user_test_456";
const SUBSCRIPTION_ID = "sub_test_789";
const INSTANCE_ID = "inst_test_abc";
const PERIOD_END_UNIX = 1735689600; // 2025-01-01 00:00:00 UTC

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Billing Webhook Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: constructEvent returns a no-op event
    mockConstructEvent.mockReturnValue(makeEvent("unknown.event", {}));

    // Default DB subscription lookup
    mockFindFirst.mockResolvedValue({
      id: "sub-db-id",
      userId: USER_ID,
      stripeCustomerId: CUSTOMER_ID,
      stripeSubscriptionId: SUBSCRIPTION_ID,
      status: "active",
    });

    // Default instance lookup
    mockGetInstanceByUserId.mockResolvedValue({ id: INSTANCE_ID });

    // Default VPS operations
    mockNotifyAgent.mockResolvedValue(undefined);
    mockDestroyInstanceFull.mockResolvedValue(undefined);
    mockDeleteInstance.mockResolvedValue(undefined);
  });

  afterEach(() => {
    // NOTE: Do NOT use vi.restoreAllMocks() here — it would break vi.fn()
    // mocks by removing their configured implementations. clearAllMocks()
    // in beforeEach is sufficient.
  });

  // =========================================================================
  // 1. Stripe Signature Verification
  // =========================================================================
  describe("Stripe signature verification", () => {
    it("should reject requests without stripe-signature header", async () => {
      const req = new Request("http://localhost/webhook", {
        method: "POST",
        body: "{}",
      });

      const res = await billingRouter.fetch(req);
      // HttpException with BAD_REQUEST (400) should be thrown
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("should reject payloads with invalid signatures", async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      const res = await sendWebhook("{}", "invalid-sig");
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("should accept payloads with valid signatures", async () => {
      mockConstructEvent.mockReturnValue(makeEvent("unknown.event", {}));

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toEqual({ received: true });
    });
  });

  // =========================================================================
  // 2. checkout.session.completed
  // =========================================================================
  describe("checkout.session.completed", () => {
    it("should upsert subscription with status=active", async () => {
      const session = {
        client_reference_id: USER_ID,
        customer: CUSTOMER_ID,
        subscription: SUBSCRIPTION_ID,
      } as unknown as Stripe.Checkout.Session;

      mockConstructEvent.mockReturnValue(
        makeEvent("checkout.session.completed", session),
      );

      mockSubscriptionsRetrieve.mockResolvedValue({
        current_period_end: PERIOD_END_UNIX,
      });

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);

      // Should call insert
      expect(mockInsert).toHaveBeenCalledTimes(1);

      // Should call values with correct data
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "generated-id-123",
          userId: USER_ID,
          stripeCustomerId: CUSTOMER_ID,
          stripeSubscriptionId: SUBSCRIPTION_ID,
          stripePriceId: "price_test_fake",
          status: "active",
          currentPeriodEnd: new Date(PERIOD_END_UNIX * 1000),
        }),
      );

      // Should call onConflictDoUpdate (upsert)
      expect(mockOnConflictDoUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          set: expect.objectContaining({
            stripeCustomerId: CUSTOMER_ID,
            stripeSubscriptionId: SUBSCRIPTION_ID,
            stripePriceId: "price_test_fake",
            status: "active",
            currentPeriodEnd: new Date(PERIOD_END_UNIX * 1000),
          }),
        }),
      );
    });

    it("should return early without inserting when userId is missing", async () => {
      const session = {
        client_reference_id: null,
        customer: CUSTOMER_ID,
        subscription: SUBSCRIPTION_ID,
      } as unknown as Stripe.Checkout.Session;

      mockConstructEvent.mockReturnValue(
        makeEvent("checkout.session.completed", session),
      );

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("should handle subscription as object (not string)", async () => {
      const session = {
        client_reference_id: USER_ID,
        customer: { id: CUSTOMER_ID },
        subscription: { id: SUBSCRIPTION_ID },
      } as unknown as Stripe.Checkout.Session;

      mockConstructEvent.mockReturnValue(
        makeEvent("checkout.session.completed", session),
      );

      mockSubscriptionsRetrieve.mockResolvedValue({
        current_period_end: PERIOD_END_UNIX,
      });

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);
      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          stripeCustomerId: CUSTOMER_ID,
          stripeSubscriptionId: SUBSCRIPTION_ID,
        }),
      );
    });
  });

  // =========================================================================
  // 3. customer.subscription.updated
  // =========================================================================
  describe("customer.subscription.updated", () => {
    it("should update status and currentPeriodEnd", async () => {
      const sub = {
        customer: CUSTOMER_ID,
        status: "active",
        current_period_end: PERIOD_END_UNIX,
      } as unknown as Stripe.Subscription;

      mockConstructEvent.mockReturnValue(
        makeEvent("customer.subscription.updated", sub),
      );

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "active",
          currentPeriodEnd: new Date(PERIOD_END_UNIX * 1000),
        }),
      );
    });

    it("should pass through non-active status values", async () => {
      const sub = {
        customer: CUSTOMER_ID,
        status: "trialing",
        current_period_end: PERIOD_END_UNIX,
      } as unknown as Stripe.Subscription;

      mockConstructEvent.mockReturnValue(
        makeEvent("customer.subscription.updated", sub),
      );

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "trialing",
        }),
      );
    });

    it("should calculate grace period deadline (+3 days) on past_due", async () => {
      const sub = {
        customer: CUSTOMER_ID,
        status: "past_due",
        current_period_end: PERIOD_END_UNIX,
      } as unknown as Stripe.Subscription;

      mockConstructEvent.mockReturnValue(
        makeEvent("customer.subscription.updated", sub),
      );

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);

      // Should update status to "past_due"
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "past_due",
        }),
      );

      // Should look up db subscription and instance
      expect(mockFindFirst).toHaveBeenCalled();
      expect(mockGetInstanceByUserId).toHaveBeenCalledWith(USER_ID);

      // Should notify agent with deadline message
      expect(mockNotifyAgent).toHaveBeenCalledWith(
        INSTANCE_ID,
        expect.stringContaining("ALERTA"),
      );

      // Verify the deadline is current_period_end + 3 days
      const notifyCall = mockNotifyAgent.mock.calls[0]!;
      const message = notifyCall[1] as string;
      const deadline = new Date(PERIOD_END_UNIX * 1000);
      deadline.setDate(deadline.getDate() + 3);
      const deadlineStr = deadline.toLocaleDateString("pt-BR");
      expect(message).toContain(deadlineStr);
    });

    it("should not notify if no instance found on past_due", async () => {
      const sub = {
        customer: CUSTOMER_ID,
        status: "past_due",
        current_period_end: PERIOD_END_UNIX,
      } as unknown as Stripe.Subscription;

      mockConstructEvent.mockReturnValue(
        makeEvent("customer.subscription.updated", sub),
      );

      mockGetInstanceByUserId.mockResolvedValue(null);

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);
      expect(mockNotifyAgent).not.toHaveBeenCalled();
    });

    it("should not notify if no subscription found in DB on past_due", async () => {
      const sub = {
        customer: CUSTOMER_ID,
        status: "past_due",
        current_period_end: PERIOD_END_UNIX,
      } as unknown as Stripe.Subscription;

      mockConstructEvent.mockReturnValue(
        makeEvent("customer.subscription.updated", sub),
      );

      mockFindFirst.mockResolvedValue(null);

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);
      expect(mockGetInstanceByUserId).not.toHaveBeenCalled();
      expect(mockNotifyAgent).not.toHaveBeenCalled();
    });

    it("should handle customer as object (not string)", async () => {
      const sub = {
        customer: { id: CUSTOMER_ID },
        status: "active",
        current_period_end: PERIOD_END_UNIX,
      } as unknown as Stripe.Subscription;

      mockConstructEvent.mockReturnValue(
        makeEvent("customer.subscription.updated", sub),
      );

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 4. customer.subscription.deleted
  // =========================================================================
  describe("customer.subscription.deleted", () => {
    it("should set status=inactive, call destroyInstanceFull, and call deleteInstance", async () => {
      const sub = {
        customer: CUSTOMER_ID,
        status: "canceled",
      } as unknown as Stripe.Subscription;

      mockConstructEvent.mockReturnValue(
        makeEvent("customer.subscription.deleted", sub),
      );

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);

      // Should update status to inactive
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "inactive",
        }),
      );

      // Should look up subscription and instance
      expect(mockFindFirst).toHaveBeenCalled();
      expect(mockGetInstanceByUserId).toHaveBeenCalledWith(USER_ID);

      // Should notify agent about cancellation
      expect(mockNotifyAgent).toHaveBeenCalledWith(
        INSTANCE_ID,
        expect.stringContaining("cancelada"),
      );

      // Should destroy and delete instance
      expect(mockDestroyInstanceFull).toHaveBeenCalledWith(INSTANCE_ID);
      expect(mockDeleteInstance).toHaveBeenCalledWith(INSTANCE_ID);
    });

    it("should not destroy instance if no DB subscription found", async () => {
      const sub = {
        customer: CUSTOMER_ID,
      } as unknown as Stripe.Subscription;

      mockConstructEvent.mockReturnValue(
        makeEvent("customer.subscription.deleted", sub),
      );

      mockFindFirst.mockResolvedValue(null);

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);
      expect(mockGetInstanceByUserId).not.toHaveBeenCalled();
      expect(mockDestroyInstanceFull).not.toHaveBeenCalled();
      expect(mockDeleteInstance).not.toHaveBeenCalled();
    });

    it("should not destroy instance if no instance found for user", async () => {
      const sub = {
        customer: CUSTOMER_ID,
      } as unknown as Stripe.Subscription;

      mockConstructEvent.mockReturnValue(
        makeEvent("customer.subscription.deleted", sub),
      );

      mockGetInstanceByUserId.mockResolvedValue(null);

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);
      expect(mockDestroyInstanceFull).not.toHaveBeenCalled();
      expect(mockDeleteInstance).not.toHaveBeenCalled();
    });

    it("should still delete instance even if destroyInstanceFull fails", async () => {
      const sub = {
        customer: CUSTOMER_ID,
      } as unknown as Stripe.Subscription;

      mockConstructEvent.mockReturnValue(
        makeEvent("customer.subscription.deleted", sub),
      );

      mockDestroyInstanceFull.mockRejectedValue(new Error("VPS unreachable"));

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);

      // destroyInstanceFull error is caught, deleteInstance still called
      expect(mockDeleteInstance).toHaveBeenCalledWith(INSTANCE_ID);
    });

    it("should still proceed if notifyAgent fails", async () => {
      const sub = {
        customer: CUSTOMER_ID,
      } as unknown as Stripe.Subscription;

      mockConstructEvent.mockReturnValue(
        makeEvent("customer.subscription.deleted", sub),
      );

      mockNotifyAgent.mockRejectedValue(new Error("Agent unreachable"));

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);

      // notifyAgent failure is caught, destroyInstanceFull and deleteInstance still called
      expect(mockDestroyInstanceFull).toHaveBeenCalledWith(INSTANCE_ID);
      expect(mockDeleteInstance).toHaveBeenCalledWith(INSTANCE_ID);
    });
  });

  // =========================================================================
  // 5. invoice.payment_failed
  // =========================================================================
  describe("invoice.payment_failed", () => {
    it("should mark subscription as past_due and call notifyAgent", async () => {
      const invoice = {
        customer: CUSTOMER_ID,
      } as unknown as Stripe.Invoice;

      mockConstructEvent.mockReturnValue(
        makeEvent("invoice.payment_failed", invoice),
      );

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);

      // Should update status to past_due
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "past_due",
        }),
      );

      // Should look up subscription and instance
      expect(mockFindFirst).toHaveBeenCalled();
      expect(mockGetInstanceByUserId).toHaveBeenCalledWith(USER_ID);

      // Should notify agent
      expect(mockNotifyAgent).toHaveBeenCalledWith(
        INSTANCE_ID,
        expect.stringContaining("ALERTA URGENTE"),
      );
    });

    it("should handle customer as object (not string)", async () => {
      const invoice = {
        customer: { id: CUSTOMER_ID },
      } as unknown as Stripe.Invoice;

      mockConstructEvent.mockReturnValue(
        makeEvent("invoice.payment_failed", invoice),
      );

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it("should skip processing if customerId is null", async () => {
      const invoice = {
        customer: null,
      } as unknown as Stripe.Invoice;

      mockConstructEvent.mockReturnValue(
        makeEvent("invoice.payment_failed", invoice),
      );

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("should not crash if notifyAgent fails", async () => {
      const invoice = {
        customer: CUSTOMER_ID,
      } as unknown as Stripe.Invoice;

      mockConstructEvent.mockReturnValue(
        makeEvent("invoice.payment_failed", invoice),
      );

      mockNotifyAgent.mockRejectedValue(new Error("Agent unreachable"));

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);
    });

    it("should not notify if no instance found", async () => {
      const invoice = {
        customer: CUSTOMER_ID,
      } as unknown as Stripe.Invoice;

      mockConstructEvent.mockReturnValue(
        makeEvent("invoice.payment_failed", invoice),
      );

      mockGetInstanceByUserId.mockResolvedValue(null);

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);
      expect(mockNotifyAgent).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 6. Unknown event type
  // =========================================================================
  describe("Unknown event type", () => {
    it("should return { received: true } for unhandled event types", async () => {
      mockConstructEvent.mockReturnValue(
        makeEvent("payment_intent.succeeded", {}),
      );

      const res = await sendWebhook("{}");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ received: true });

      // No DB operations should occur
      expect(mockInsert).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 7. Full Lifecycle: active -> past_due -> grace -> deleted
  // =========================================================================
  describe("Full subscription lifecycle", () => {
    it("should handle active -> past_due -> deleted flow", async () => {
      // --- Step 1: Checkout completed (active) ---
      const session = {
        client_reference_id: USER_ID,
        customer: CUSTOMER_ID,
        subscription: SUBSCRIPTION_ID,
      } as unknown as Stripe.Checkout.Session;

      mockConstructEvent.mockReturnValue(
        makeEvent("checkout.session.completed", session),
      );
      mockSubscriptionsRetrieve.mockResolvedValue({
        current_period_end: PERIOD_END_UNIX,
      });

      let res = await sendWebhook("{}");
      expect(res.status).toBe(200);
      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({ status: "active" }),
      );

      vi.clearAllMocks();
      // Reset default mocks after clearing
      mockFindFirst.mockResolvedValue({
        id: "sub-db-id",
        userId: USER_ID,
        stripeCustomerId: CUSTOMER_ID,
        stripeSubscriptionId: SUBSCRIPTION_ID,
        status: "active",
      });
      mockGetInstanceByUserId.mockResolvedValue({ id: INSTANCE_ID });
      mockNotifyAgent.mockResolvedValue(undefined);
      mockDestroyInstanceFull.mockResolvedValue(undefined);
      mockDeleteInstance.mockResolvedValue(undefined);

      // --- Step 2: Invoice payment failed (past_due) ---
      const invoice = {
        customer: CUSTOMER_ID,
      } as unknown as Stripe.Invoice;

      mockConstructEvent.mockReturnValue(
        makeEvent("invoice.payment_failed", invoice),
      );

      res = await sendWebhook("{}");
      expect(res.status).toBe(200);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: "past_due" }),
      );
      expect(mockNotifyAgent).toHaveBeenCalledWith(
        INSTANCE_ID,
        expect.stringContaining("ALERTA URGENTE"),
      );

      vi.clearAllMocks();
      // Reset default mocks after clearing
      mockFindFirst.mockResolvedValue({
        id: "sub-db-id",
        userId: USER_ID,
        stripeCustomerId: CUSTOMER_ID,
        stripeSubscriptionId: SUBSCRIPTION_ID,
        status: "past_due",
      });
      mockGetInstanceByUserId.mockResolvedValue({ id: INSTANCE_ID });
      mockNotifyAgent.mockResolvedValue(undefined);
      mockDestroyInstanceFull.mockResolvedValue(undefined);
      mockDeleteInstance.mockResolvedValue(undefined);

      // --- Step 3: Subscription updated with past_due + grace period ---
      const subUpdated = {
        customer: CUSTOMER_ID,
        status: "past_due",
        current_period_end: PERIOD_END_UNIX,
      } as unknown as Stripe.Subscription;

      mockConstructEvent.mockReturnValue(
        makeEvent("customer.subscription.updated", subUpdated),
      );

      res = await sendWebhook("{}");
      expect(res.status).toBe(200);

      // Verify grace period: deadline = period_end + 3 days
      const deadline = new Date(PERIOD_END_UNIX * 1000);
      deadline.setDate(deadline.getDate() + 3);
      const deadlineStr = deadline.toLocaleDateString("pt-BR");
      expect(mockNotifyAgent).toHaveBeenCalledWith(
        INSTANCE_ID,
        expect.stringContaining(deadlineStr),
      );

      vi.clearAllMocks();
      // Reset default mocks after clearing
      mockFindFirst.mockResolvedValue({
        id: "sub-db-id",
        userId: USER_ID,
        stripeCustomerId: CUSTOMER_ID,
        stripeSubscriptionId: SUBSCRIPTION_ID,
        status: "past_due",
      });
      mockGetInstanceByUserId.mockResolvedValue({ id: INSTANCE_ID });
      mockNotifyAgent.mockResolvedValue(undefined);
      mockDestroyInstanceFull.mockResolvedValue(undefined);
      mockDeleteInstance.mockResolvedValue(undefined);

      // --- Step 4: Subscription deleted (inactive + destroy) ---
      const subDeleted = {
        customer: CUSTOMER_ID,
        status: "canceled",
      } as unknown as Stripe.Subscription;

      mockConstructEvent.mockReturnValue(
        makeEvent("customer.subscription.deleted", subDeleted),
      );

      res = await sendWebhook("{}");
      expect(res.status).toBe(200);

      // Status should be set to inactive
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: "inactive" }),
      );

      // Should notify, destroy, and delete
      expect(mockNotifyAgent).toHaveBeenCalledWith(
        INSTANCE_ID,
        expect.stringContaining("cancelada"),
      );
      expect(mockDestroyInstanceFull).toHaveBeenCalledWith(INSTANCE_ID);
      expect(mockDeleteInstance).toHaveBeenCalledWith(INSTANCE_ID);
    });
  });
});
