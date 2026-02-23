import { zValidator } from "@hono/zod-validator";
import { env } from "hono/adapter";
import { createMiddleware } from "hono/factory";

import { auth } from "@workspace/auth/server";
import { makeZodI18nMap } from "@workspace/i18n";
import { getLocaleFromRequest, getTranslation } from "@workspace/i18n/server";
import { getInstanceByUserId } from "@workspace/openclaw/server";
import { HttpStatusCode, NodeEnv } from "@workspace/shared/constants";
import { HttpException } from "@workspace/shared/utils";

import type { User } from "@workspace/auth";
import type { TFunction } from "@workspace/i18n";
import type { ValidationTargets } from "hono";
import type { $ZodRawIssue, $ZodType } from "zod/v4/core";

/**
 * Reusable middleware that enforces users are logged in before running the
 * procedure
 */
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

/**
 * Reusable middleware that enforces an instance exists for the user before running the
 * procedure
 */
export const enforceInstance = createMiddleware<{
  Variables: {
    user: User;
    instanceId: string;
  };
}>(async (c, next) => {
  const instance = await getInstanceByUserId(c.var.user.id);

  if (!instance) {
    throw new HttpException(HttpStatusCode.NOT_FOUND, {
      code: "dashboard:instance.error.notFound",
    });
  }

  c.set("instanceId", instance.id);
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

/**
 * Middleware for adding an articifial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
export const delay = createMiddleware<{
  Bindings: {
    NODE_ENV: string;
  };
}>(async (c, next) => {
  if (env(c).NODE_ENV === NodeEnv.DEVELOPMENT) {
    // artificial delay in dev 100-500ms
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  await next();
});

/**
 * Middleware for setting the language based on the cookie and accept-language header.
 */
export const localize = createMiddleware<{
  Variables: {
    locale: string;
  };
}>(async (c, next) => {
  const locale = getLocaleFromRequest(c.req.raw);
  c.set("locale", locale);
  await next();
});

/**
 * Middleware for validating the request input using Zod.
 */
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
