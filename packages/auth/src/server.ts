import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";

import * as schema from "@workspace/db/schema";
import { db } from "@workspace/db/server";
import { NodeEnv } from "@workspace/shared/constants";
import { logger } from "@workspace/shared/logger";

import { env } from "./env";
import { SocialProvider } from "./types";

export const auth = betterAuth({
  appName: "OpenClaw Kit",
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  trustedOrigins: [
    "https://5195-2a02-a316-40da-6980-10ac-a2fb-b2d-3e12.ngrok-free.app",
    ...(env.NODE_ENV === NodeEnv.DEVELOPMENT
      ? ["http://localhost*", "https://localhost*"]
      : []),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  socialProviders: {
    [SocialProvider.GOOGLE]: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    [SocialProvider.GITHUB]: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  advanced: {
    cookiePrefix: "openclaw",
    cookies: {
      state: {
        attributes: {
          sameSite: "none",
          secure: true,
        },
      },
    },
  },
  logger: {
    log: (level, ...args) => logger[level](...args),
  },
});

export type AuthErrorCode = keyof typeof auth.$ERROR_CODES;
export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
