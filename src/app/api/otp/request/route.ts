import { NextRequest, NextResponse } from "next/server";
import { getVendorByToken } from "@/lib/tickets";
import { requestOtp } from "@/lib/otp";

export async function POST(request: NextRequest) {
  const { token } = await request.json();
  const vendor = getVendorByToken(token);
  if (!vendor) {
    return NextResponse.json({ error: "Unknown link" }, { status: 404 });
  }

  const code = requestOtp(token);

  // No WhatsApp Business API / SMS provider connected yet — the code is
  // returned directly so the demo flow is testable end to end.
  return NextResponse.json({ ok: true, devCode: code });
}
