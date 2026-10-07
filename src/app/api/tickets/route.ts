import { NextRequest, NextResponse } from "next/server";
import { createTicket, listTicketsForVendor } from "@/lib/tickets";
import { getSessionVendorId } from "@/lib/session";
import type { Category, TicketFields } from "@/lib/types";

export async function GET(request: NextRequest) {
  const vendorId = getSessionVendorId(request);
  if (!vendorId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const tickets = listTicketsForVendor(vendorId);
  return NextResponse.json({ tickets });
}

export async function POST(request: NextRequest) {
  const vendorId = getSessionVendorId(request);
  if (!vendorId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await request.json()) as {
    restaurant: string;
    branch?: string;
    category: Category;
    fields: TicketFields;
  };

  // branch is only collected for Tech Support (src/components/portal/PortalWizard.tsx)
  // — every other category legitimately submits it blank.
  if (!body.restaurant || !body.category) {
    return NextResponse.json({ error: "Missing restaurant or category" }, { status: 400 });
  }

  const result = createTicket({
    vendorId,
    restaurant: body.restaurant,
    branch: body.branch ?? "",
    category: body.category,
    fields: body.fields ?? {},
  });

  return NextResponse.json(result);
}
