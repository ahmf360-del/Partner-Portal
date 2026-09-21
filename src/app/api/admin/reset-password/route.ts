import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/adminAuth";
import { resetVendorPassword } from "@/lib/tickets";

export async function POST(request: NextRequest) {
  const authed = isValidAdminCookie(request.cookies.get(ADMIN_COOKIE)?.value);
  if (!authed) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { vendorId } = (await request.json()) as { vendorId: number };
  if (!vendorId) return NextResponse.json({ error: "Missing vendorId" }, { status: 400 });

  const password = resetVendorPassword(vendorId);
  return NextResponse.json({ password });
}
