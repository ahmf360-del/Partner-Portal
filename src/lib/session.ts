import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

// Signed, stateless session cookie: "<vendorId>.<hmac>". Not a JWT (no need
// for the extra dependency/complexity at this scale) — same idea, hand-rolled.
const SECRET = process.env.SESSION_SECRET || "breadfast-demo-session-secret";

export const SESSION_COOKIE = "bf_session";

function sign(vendorId: number): string {
  return createHmac("sha256", SECRET).update(String(vendorId)).digest("hex");
}

export function createSessionToken(vendorId: number): string {
  return `${vendorId}.${sign(vendorId)}`;
}

export function verifySessionToken(token: string | undefined): number | null {
  if (!token) return null;
  const [idStr, sig] = token.split(".");
  const vendorId = Number(idStr);
  if (!idStr || !sig || !Number.isInteger(vendorId)) return null;

  const expected = Buffer.from(sign(vendorId));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return vendorId;
}

/** Reads and verifies the session cookie from an API request. */
export function getSessionVendorId(request: NextRequest): number | null {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}
