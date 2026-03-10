/**
 * AES-256-GCM encryption utilities using the Web Crypto API.
 *
 * The key is provided as a 64-character hex string (32 bytes).
 * Encrypted values are stored as "<iv_hex>:<ciphertext_base64>" strings.
 */

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function importKey(hexKey: string): Promise<CryptoKey> {
  const keyBytes = hexToBytes(hexKey);
  return crypto.subtle.importKey("raw", keyBytes, ALGORITHM, false, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Encrypts a plaintext string.
 * @param value    The string to encrypt.
 * @param hexKey   A 64-character hex string (32 bytes = 256-bit key).
 * @returns        Encrypted token in the format "<iv_hex>:<ciphertext_base64>".
 */
export async function encrypt(value: string, hexKey: string): Promise<string> {
  const key = await importKey(hexKey);
  const iv = crypto.getRandomValues(
    new Uint8Array(IV_LENGTH),
  );
  const encoded = new TextEncoder().encode(value);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded,
  );

  const ivHex = bytesToHex(iv);
  const ciphertextB64 = btoa(
    String.fromCharCode(...new Uint8Array(ciphertext)),
  );

  return `${ivHex}:${ciphertextB64}`;
}

/**
 * Decrypts a token produced by `encrypt`.
 * @param token    The "<iv_hex>:<ciphertext_base64>" string.
 * @param hexKey   The same 64-character hex key used for encryption.
 * @returns        The original plaintext string.
 */
export async function decrypt(token: string, hexKey: string): Promise<string> {
  const colonIdx = token.indexOf(":");
  if (colonIdx === -1) throw new Error("Invalid encrypted token format");

  const ivHex = token.slice(0, colonIdx);
  const ciphertextB64 = token.slice(colonIdx + 1);

  const iv = hexToBytes(ivHex);
  const ciphertextBytes = Uint8Array.from(atob(ciphertextB64), (c) =>
    c.charCodeAt(0),
  );

  const key = await importKey(hexKey);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertextBytes,
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Returns true if the value looks like an encrypted token (iv_hex:ciphertext_base64).
 * Used to skip double-encryption of already-encrypted values.
 */
export function isEncrypted(value: string): boolean {
  // IV is 12 bytes = 24 hex chars
  return /^[0-9a-f]{24}:[A-Za-z0-9+/=]+$/.test(value);
}
