import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as loggerMiddleware } from "hono/logger";
import { statusMonitor } from "hono-status-monitor";

import { db } from "@workspace/db/server";
import { logger } from "@workspace/shared/logger";

import { localize, delay } from "./middleware";
import { authRouter } from "./modules/auth/router";
import { openclawRouter } from "./modules/openclaw/router";
import { onError } from "./utils/on-error";

const monitor = statusMonitor({
  healthCheck: async () => {
    const start = performance.now();
    await db.execute(`SELECT 1`);
    return {
      connected: true,
      latencyMs: performance.now() - start,
    };
  },
});

const appRouter = new Hono()
  .basePath("/api")
  .use(
    cors({
      origin: "*",
      allowHeaders: ["Content-Type", "Authorization"],
      maxAge: 3600,
      credentials: true,
    }),
  )
  .use(loggerMiddleware((...args) => logger.info(...args)))
  .use(delay)
  .use(localize)
  .use(monitor.middleware)
  .route("/status", monitor.routes)
  .route("/auth", authRouter)
  .route("/openclaw", openclawRouter)
  .onError(onError);

type AppRouter = typeof appRouter;

export type { AppRouter };
export { appRouter };
