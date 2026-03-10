import * as Sentry from "@sentry/nextjs";
import * as z from "zod";

import { isKey } from "@workspace/i18n";
import { getTranslation } from "@workspace/i18n/server";
import { logger } from "@workspace/shared/logger";
import { getStatusCode } from "@workspace/shared/utils";

import type { Context } from "hono";

const errorSchema = z.object({
  code: z.string().optional(),
  message: z.string(),
});

const isError = (e: unknown): e is z.infer<typeof errorSchema> => {
  return errorSchema.safeParse(e).success;
};

export const onError = async (
  e: unknown,
  c?: Context<{
    Bindings: { NODE_ENV: string };
    Variables: { locale: string };
  }>,
) => {
  const { t, i18n } = await getTranslation({
    locale: c?.var.locale,
    request: c?.req.raw,
  });

  const status = getStatusCode(e);
  const details = {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  };

  const timestamp = new Date().toISOString();
  const path = c?.req.raw.url ? new URL(c.req.raw.url).pathname : "/api";

  // Suppress noisy but expected client errors (401/403/404) from server logs
  const isExpectedClientError =
    status === 401 || status === 403 || status === 404;

  if (isError(e)) {
    if (!isExpectedClientError) {
      logger.error(e.code, e.message);
      Sentry.captureException(e, {
        extra: { code: e.code, path, status },
      });
    }
    return new Response(
      JSON.stringify({
        code: e.code,
        message: e.message
          ? e.message
          : e.code && isKey(e.code, i18n)
            ? t(e.code)
            : ((e.message || e.code) ?? t("common:error.general")),
        status,
        timestamp,
        path,
      }),
      details,
    );
  }

  logger.error(e);
  Sentry.captureException(e, {
    extra: { path, status },
  });
  return new Response(
    JSON.stringify({
      code: "common:error.general",
      message: t("common:error.general"),
      status,
      path,
    }),
    details,
  );
};
