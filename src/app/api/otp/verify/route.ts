import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp";

export async function POST(request: NextRequest) {
  const { token, code } = await request.json();
  if (!token || !code) {
    return NextResponse.json({ error: "Missing token or code" }, { status: 400 });
  }
  const ok = verifyOtp(token, code);
  if (!ok) {
    return NextResponse.json({ error: "That code didn't match or expired" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
