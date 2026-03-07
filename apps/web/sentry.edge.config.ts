import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Only enable in production when DSN is configured
  enabled: !!process.env.SENTRY_DSN,

  environment: process.env.NODE_ENV ?? "development",
});
