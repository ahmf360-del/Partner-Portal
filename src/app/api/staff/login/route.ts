import { NextRequest, NextResponse } from "next/server";
import { verifyStaffLogin } from "@/lib/staff";
import { createStaffSessionToken, STAFF_SESSION_COOKIE } from "@/lib/session";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
  }

  const staff = verifyStaffLogin(username, password);
  if (!staff) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(STAFF_SESSION_COOKIE, createStaffSessionToken(staff.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
