import { NextRequest, NextResponse } from "next/server";
import { getSessionStaffId } from "@/lib/session";
import { getTicketWithVendor } from "@/lib/tickets";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const staffId = getSessionStaffId(request);
  if (!staffId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const ticket = getTicketWithVendor(Number(id));
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  return NextResponse.json({ ticket });
}
