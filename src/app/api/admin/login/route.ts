import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieValue, checkAdminPassword } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  if (!password || !checkAdminPassword(password)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, adminCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
