import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as loggerMiddleware } from "hono/logger";
import { statusMonitor } from "hono-status-monitor";

import { db } from "@workspace/db/server";
import { logger } from "@workspace/shared/logger";

import { localize, delay, rateLimit } from "./middleware";
import { authRouter } from "./modules/auth/router";
import { billingRouter } from "./modules/billing/router";
import { openclawRouter } from "./modules/openclaw/router";
import { adminRouter } from "./modules/admin/router";
import { supportRouter } from "./modules/support/router";
import { seedVpsServers } from "./modules/admin/vps-config";
import { seedAiModels } from "./modules/admin/models-config";
import { modelsRouter } from "./modules/admin/models-router";
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
      origin: [
        "https://clawin1click.com",
        "https://www.clawin1click.com",
        "http://localhost:3000",
      ],
      allowHeaders: ["Content-Type", "Authorization"],
      maxAge: 3600,
      credentials: true,
    }),
  )
  .use(loggerMiddleware((...args) => logger.info(...args)))
  .use(delay)
  .use(localize)
  // Global rate limit: 120 req/min per IP
  .use(rateLimit(120, 60_000))
  .use(monitor.middleware)
  .route("/status", monitor.routes)
  .route("/auth", authRouter)
  .route("/billing", billingRouter)
  // Deploy endpoint: 10 req/hour per IP (prevent abuse)
  .use("/openclaw", rateLimit(10, 60 * 60_000))
  .route("/openclaw", openclawRouter)
  .route("/models", modelsRouter)
  .route("/admin", adminRouter)
  .route("/support", supportRouter)
  .onError(onError);

type AppRouter = typeof appRouter;

export type { AppRouter };
export { appRouter };
// Seed on startup
seedVpsServers().catch((e) => logger.error("Failed to seed VPS servers", e));
seedAiModels().catch((e) => logger.error("Failed to seed AI models", e));
