/* eslint-disable no-restricted-properties */

/**
 * Centralized pricing configuration.
 *
 * Display values and Stripe Price IDs are resolved from environment variables
 * so that pricing changes only require: create Price in Stripe -> update env
 * vars -> deploy. No code change needed.
 *
 * Client-side code should read NEXT_PUBLIC_* variants; server-side code may
 * read either the unprefixed or prefixed form.
 */

export type CurrencyCode = "usd" | "brl";

export interface PricingEntry {
  readonly priceId: string;
  readonly displayValue: string;
  readonly nextDisplayValue: string;
  readonly currency: CurrencyCode;
}

const getEnv = (key: string): string =>
  (typeof process !== "undefined" ? process.env?.[key] : undefined) ?? "";

export const getPricing = (): Record<
  Uppercase<CurrencyCode>,
  PricingEntry
> => ({
  USD: {
    priceId:
      getEnv("STRIPE_PRICE_ID_USD") ||
      getEnv("NEXT_PUBLIC_STRIPE_PRICE_ID_USD") ||
      getEnv("STRIPE_PRICE_ID") ||
      "",
    displayValue:
      getEnv("PRICE_DISPLAY_USD") ||
      getEnv("NEXT_PUBLIC_PRICE_DISPLAY_USD") ||
      "$29.90",
    nextDisplayValue:
      getEnv("NEXT_PRICE_DISPLAY_USD") ||
      getEnv("NEXT_PUBLIC_NEXT_PRICE_DISPLAY_USD") ||
      "$39.90",
    currency: "usd",
  },
  BRL: {
    priceId:
      getEnv("STRIPE_PRICE_ID_BRL") ||
      getEnv("NEXT_PUBLIC_STRIPE_PRICE_ID_BRL") ||
      getEnv("STRIPE_PRICE_ID") ||
      "",
    displayValue:
      getEnv("PRICE_DISPLAY_BRL") ||
      getEnv("NEXT_PUBLIC_PRICE_DISPLAY_BRL") ||
      "R$153,39",
    nextDisplayValue:
      getEnv("NEXT_PRICE_DISPLAY_BRL") ||
      getEnv("NEXT_PUBLIC_NEXT_PRICE_DISPLAY_BRL") ||
      "R$199,90",
    currency: "brl",
  },
});

/**
 * Convenience helper — returns the display price string for a given currency.
 */
export const getDisplayPrice = (currency: CurrencyCode): string =>
  getPricing()[currency.toUpperCase() as Uppercase<CurrencyCode>].displayValue;

/**
 * Convenience helper — returns the "next" (upcoming) display price for a given currency.
 */
export const getNextDisplayPrice = (currency: CurrencyCode): string =>
  getPricing()[currency.toUpperCase() as Uppercase<CurrencyCode>]
    .nextDisplayValue;

/**
 * Convenience helper — returns the Stripe Price ID for a given currency.
 */
export const getPriceId = (currency: CurrencyCode): string =>
  getPricing()[currency.toUpperCase() as Uppercase<CurrencyCode>].priceId;
