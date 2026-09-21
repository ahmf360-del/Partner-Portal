import { NextResponse } from "next/server";
import { STAFF_SESSION_COOKIE } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(STAFF_SESSION_COOKIE);
  return res;
}
