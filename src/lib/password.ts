import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// scrypt is in Node's standard library, so this needs no extra dependency.
// Format: "<salt-hex>:<hash-hex>".
export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(plain, salt, 64);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const ADJECTIVES = ["swift", "sunny", "fresh", "golden", "bright", "steady", "warm", "kind"];
const NOUNS = ["oven", "bakery", "wheat", "harvest", "market", "basket", "morning", "dough"];

/** A random, easy-to-read password for handing to a vendor over the phone. */
export function generateReadablePassword(): string {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${a}-${n}-${num}`;
}
