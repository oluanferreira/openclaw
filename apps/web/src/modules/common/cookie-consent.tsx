"use client";

import { useEffect, useState } from "react";

import { useTranslation } from "@workspace/i18n";

const COOKIE_NAME = "cookie-consent";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

type ConsentState = "all" | "necessary" | null;

function getConsent(): ConsentState {
  if (typeof window === "undefined") return null;

  // Check cookie first
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  if (match) {
    const value = match.split("=")[1];
    if (value === "all" || value === "necessary") return value;
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(COOKIE_NAME);
    if (stored === "all" || stored === "necessary") return stored;
  } catch {
    // localStorage not available
  }

  return null;
}

function setConsent(value: "all" | "necessary") {
  // Set cookie
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;

  // Set localStorage fallback
  try {
    localStorage.setItem(COOKIE_NAME, value);
  } catch {
    // localStorage not available
  }
}

export const CookieConsent = () => {
  const { t } = useTranslation("common");
  const [consent, setConsentState] = useState<ConsentState | "loading">(
    "loading",
  );

  useEffect(() => {
    setConsentState(getConsent());
  }, []);

  if (consent === "loading" || consent !== null) return null;

  const handleAccept = (value: "all" | "necessary") => {
    setConsent(value);
    setConsentState(value);
  };

  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-50 border-t p-4 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-muted-foreground text-center text-sm sm:text-left">
          {t("legal.cookieConsent.message")}
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => handleAccept("necessary")}
            className="text-muted-foreground hover:text-foreground cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors"
          >
            {t("legal.cookieConsent.necessary")}
          </button>
          <button
            type="button"
            onClick={() => handleAccept("all")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer rounded-full px-4 py-2 text-sm transition-colors"
          >
            {t("legal.cookieConsent.accept")}
          </button>
        </div>
      </div>
    </div>
  );
};
