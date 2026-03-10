import env from "env.config";
import { NextResponse } from "next/server";
import { i18nRouter } from "next-i18n-router";

import { config as i18nConfig } from "@workspace/i18n";
import { getLocaleFromRequest } from "@workspace/i18n/server";

import { appConfig } from "~/config/app";

import type { NextRequest } from "next/server";

const REF_COOKIE = "ref";
const REF_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

// Match /r/:ref or /[locale]/r/:ref
const REFERRAL_REGEX = /^\/(?:(?:en|pt|es)\/)?r\/([^/]+)\/?$/;

export const proxy = (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // ─── Referral tracking ──────────────────────────────────
  const refMatch = REFERRAL_REGEX.exec(pathname);
  if (refMatch?.[1]) {
    const refCode = refMatch[1];
    const url = request.nextUrl.clone();
    url.pathname = "/";

    const response = NextResponse.redirect(url);

    // First-click attribution: only set if no existing ref cookie
    if (!request.cookies.get(REF_COOKIE)) {
      response.cookies.set(REF_COOKIE, refCode, {
        maxAge: REF_MAX_AGE,
        path: "/",
        sameSite: "lax",
        httpOnly: false, // needs to be readable client-side
      });
    }

    return response;
  }

  // ─── i18n routing ───────────────────────────────────────
  return i18nRouter(request, {
    locales: i18nConfig.locales,
    defaultLocale:
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      appConfig.locale ?? env.DEFAULT_LOCALE ?? i18nConfig.defaultLocale,
    localeCookie: i18nConfig.cookie,
    localeDetector: getLocaleFromRequest,
  });
};

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next).*)",
  unstable_allowDynamic: ["**/node_modules/lodash*/**/*.js"],
};
