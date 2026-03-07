const REDACTED_PATTERNS = [
  "_REDACTED_",
  "REDACTED",
  "_OPENCLAW_REDACTED_",
] as const;

/**
 * Returns true if the value appears to be a redacted/masked placeholder.
 * Used to prevent sync-back from overwriting real data with redacted values.
 */
export function isRedactedValue(value: string): boolean {
  const upper = value.toUpperCase();
  return REDACTED_PATTERNS.some((pattern) => upper.includes(pattern));
}
