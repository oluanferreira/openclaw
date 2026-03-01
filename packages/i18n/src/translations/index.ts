import { en } from "./en";
import { es } from "./es";
import { pt } from "./pt";

import type { config } from "../config";

export const translations: Record<
  (typeof config.locales)[number],
  typeof en & typeof es & typeof pt
> = {
  en,
  es,
  pt,
} as const;
