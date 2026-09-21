import { NextRequest, NextResponse } from "next/server";
import { rateTicket } from "@/lib/tickets";
import { getSessionVendorId } from "@/lib/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const vendorId = getSessionVendorId(request);
  if (!vendorId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const { rating } = (await request.json()) as { rating: number };
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }
  const ticket = rateTicket(Number(id), rating, vendorId);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  return NextResponse.json({ ticket });
}
