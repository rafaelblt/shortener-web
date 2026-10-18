const SLUG_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const GENERATED_SLUG_LENGTH = 6;

export function randomId(): string {
  return crypto.randomUUID();
}

/** A slug like the ones the shortener generates: 6 random ASCII letters and digits. */
export function randomSlug(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(GENERATED_SLUG_LENGTH));
  return Array.from(bytes, (byte) => SLUG_ALPHABET.charAt(byte % SLUG_ALPHABET.length)).join("");
}
