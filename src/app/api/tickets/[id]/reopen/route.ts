import { NextRequest, NextResponse } from "next/server";
import { reopenTicket } from "@/lib/tickets";
import { getSessionVendorId } from "@/lib/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const vendorId = getSessionVendorId(request);
  if (!vendorId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const ticket = reopenTicket(Number(id), vendorId);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  return NextResponse.json({ ticket });
}
