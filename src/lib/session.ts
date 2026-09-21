import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

// Signed, stateless session cookie: "<role>:<id>.<hmac>". Not a JWT (no need
// for the extra dependency/complexity at this scale) — same idea, hand-rolled.
// The role is part of the signed payload (not just the cookie name) so a
// vendor session token can never be replayed as a staff one even if someone
// pastes the raw cookie value into the wrong cookie.
const SECRET = process.env.SESSION_SECRET || "breadfast-demo-session-secret";

export const SESSION_COOKIE = "bf_session";
export const STAFF_SESSION_COOKIE = "bf_staff_session";

type Role = "vendor" | "staff";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

function createToken(role: Role, id: number): string {
  const payload = `${role}:${id}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined, expectedRole: Role): number | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  const [role, idStr] = payload.split(":");
  const id = Number(idStr);
  if (role !== expectedRole || !idStr || !Number.isInteger(id)) return null;
  return id;
}

export function createSessionToken(vendorId: number): string {
  return createToken("vendor", vendorId);
}

export function verifySessionToken(token: string | undefined): number | null {
  return verifyToken(token, "vendor");
}

export function createStaffSessionToken(staffId: number): string {
  return createToken("staff", staffId);
}

export function verifyStaffSessionToken(token: string | undefined): number | null {
  return verifyToken(token, "staff");
}

/** Reads and verifies the vendor session cookie from an API request. */
export function getSessionVendorId(request: NextRequest): number | null {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

/** Reads and verifies the staff session cookie from an API request. */
export function getSessionStaffId(request: NextRequest): number | null {
  return verifyStaffSessionToken(request.cookies.get(STAFF_SESSION_COOKIE)?.value);
}
