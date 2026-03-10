import { zValidator } from "@hono/zod-validator";
import { env } from "hono/adapter";
import { createMiddleware } from "hono/factory";

// ---------------------------------------------------------------------------
// Rate Limiter (in-memory, single-instance)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Prune expired entries every 5 minutes to avoid unbounded growth
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetAt) rateLimitStore.delete(key);
    }
  },
  5 * 60 * 1000,
);

/**
 * Creates a rate-limiting middleware.
 *
 * @param max      Maximum requests allowed within the window
 * @param windowMs Time window in milliseconds (default: 60 000 = 1 min)
 * @param keyFn    Function to derive the bucket key from the request (default: IP)
 */
export function rateLimit(
  max: number,
  windowMs = 60_000,
  keyFn?: (c: Parameters<Parameters<typeof createMiddleware>[0]>[0]) => string,
) {
  return createMiddleware(async (c, next) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "unknown";
    const key = keyFn
      ? keyFn(c as Parameters<typeof keyFn>[0])
      : `rl:${ip}:${c.req.path}`;
    const now = Date.now();

    let entry = rateLimitStore.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    const remaining = Math.max(0, max - entry.count);
    const resetSec = Math.ceil((entry.resetAt - now) / 1000);

    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(resetSec));

    if (entry.count > max) {
      c.header("Retry-After", String(resetSec));
      return c.json(
        { error: "Too many requests. Please try again later." },
        429,
      );
    }

    await next();
  });
}

import { auth } from "@workspace/auth/server";
import { db } from "@workspace/db/server";
import { makeZodI18nMap } from "@workspace/i18n";
import { getLocaleFromRequest, getTranslation } from "@workspace/i18n/server";
import { getInstanceByUserId } from "@workspace/openclaw/server";
import { HttpStatusCode, NodeEnv } from "@workspace/shared/constants";
import { HttpException } from "@workspace/shared/utils";

import type { User } from "@workspace/auth";
import type { TFunction } from "@workspace/i18n";
import type { ValidationTargets } from "hono";
import type { $ZodRawIssue, $ZodType } from "zod/v4/core";

export const enforceAuth = createMiddleware<{
  Variables: {
    user: User;
  };
}>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  const user = session?.user ?? null;

  if (!user) {
    throw new HttpException(HttpStatusCode.UNAUTHORIZED, {
      code: "error.unauthorized",
    });
  }

  c.set("user", user);
  await next();
});

export const enforceInstance = createMiddleware<{
  Variables: {
    user: User;
    instanceId: string;
    vpsId: string;
  };
}>(async (c, next) => {
  const instance = await getInstanceByUserId(c.var.user.id);

  if (!instance) {
    throw new HttpException(HttpStatusCode.NOT_FOUND, {
      code: "dashboard:instance.error.notFound",
    });
  }

  c.set("instanceId", instance.id);
  c.set("vpsId", instance.vpsId);
  await next();
});

export const enforceNoInstance = createMiddleware<{
  Variables: {
    user: User;
  };
}>(async (c, next) => {
  const instance = await getInstanceByUserId(c.var.user.id);
  if (instance) {
    throw new HttpException(HttpStatusCode.BAD_REQUEST, {
      code: "dashboard:instance.error.alreadyExists",
    });
  }
  await next();
});

const ADMIN_EMAILS = ["luanferreira.emp@gmail.com", "luizjuniorbjj@gmail.com"];

export const enforceAdmin = createMiddleware<{
  Variables: {
    user: User;
  };
}>(async (c, next) => {
  const user = c.var.user;
  if (!ADMIN_EMAILS.includes(user.email)) {
    throw new HttpException(HttpStatusCode.FORBIDDEN, {
      code: "error.forbidden",
    });
  }
  await next();
});

export const delay = createMiddleware<{
  Bindings: {
    NODE_ENV: string;
  };
}>(async (c, next) => {
  if (env(c).NODE_ENV === NodeEnv.DEVELOPMENT) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  await next();
});

export const localize = createMiddleware<{
  Variables: {
    locale: string;
  };
}>(async (c, next) => {
  const locale = getLocaleFromRequest(c.req.raw);
  c.set("locale", locale);
  await next();
});

export const validate = <
  T extends $ZodType,
  Target extends keyof ValidationTargets,
>(
  target: Target,
  schema: T,
) =>
  zValidator(target, schema, async (result, c) => {
    if (!result.success) {
      const { t } = await getTranslation({
        locale:
          "locale" in c.var && typeof c.var.locale === "string"
            ? c.var.locale
            : getLocaleFromRequest(c.req.raw),
      });
      const error = result.error.issues[0];

      if (!error) {
        throw new HttpException(HttpStatusCode.UNPROCESSABLE_ENTITY);
      }

      const { message, code } = makeZodI18nMap({ t: t as TFunction })(
        error as $ZodRawIssue,
      );

      throw new HttpException(HttpStatusCode.UNPROCESSABLE_ENTITY, {
        code,
        message,
      });
    }
  });

export const enforceSubscription = createMiddleware<{
  Variables: {
    user: User;
  };
}>(async (c, next) => {
  // Admin accounts bypass subscription requirement
  if (ADMIN_EMAILS.includes(c.var.user.email)) {
    await next();
    return;
  }

  const sub = await db.query.subscription.findFirst({
    where: (t, { eq: eqFn }) => eqFn(t.userId, c.var.user.id),
  });

  if (sub?.status !== "active") {
    throw new HttpException(HttpStatusCode.PAYMENT_REQUIRED, {
      code: "billing:subscription.required",
    });
  }

  await next();
});
