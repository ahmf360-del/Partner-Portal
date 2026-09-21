import crypto from "crypto";

// Minimal shared-password gate for the internal link directory — one password
// for whoever manages vendor links, not real multi-admin auth. Set
// ADMIN_PASSWORD in your hosting provider's env vars before this is used for
// anything beyond testing; the fallback below is for local dev only.
const SECRET = process.env.ADMIN_PASSWORD || "breadfast-demo";

export const ADMIN_COOKIE = "bf_admin";

function sessionSignature(): string {
  return crypto.createHmac("sha256", SECRET).update("admin-session").digest("hex");
}

export function checkAdminPassword(password: string): boolean {
  return password === SECRET;
}

export function adminCookieValue(): string {
  return sessionSignature();
}

export function isValidAdminCookie(value: string | undefined): boolean {
  return !!value && value === sessionSignature();
}
