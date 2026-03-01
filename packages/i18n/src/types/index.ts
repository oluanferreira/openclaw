export const Locale = {
  EN: "en",
  ES: "es",
  PT: "pt",
} as const;

export type Locale = (typeof Locale)[keyof typeof Locale];

export const LocaleLabel: Record<Locale, string> = {
  [Locale.EN]: "English",
  [Locale.ES]: "Español",
  [Locale.PT]: "Português",
} as const;

export type { TFunction } from "i18next";
