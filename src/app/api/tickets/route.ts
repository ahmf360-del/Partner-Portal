import { NextRequest, NextResponse } from "next/server";
import { createTicket, getVendorByToken, listTicketsForVendor } from "@/lib/tickets";
import type { Category, TicketFields } from "@/lib/types";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const vendor = getVendorByToken(token);
  if (!vendor) return NextResponse.json({ error: "Unknown link" }, { status: 404 });

  const tickets = listTicketsForVendor(vendor.id);
  return NextResponse.json({ tickets });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    token: string;
    branch: string;
    category: Category;
    fields: TicketFields;
  };

  const vendor = getVendorByToken(body.token);
  if (!vendor) return NextResponse.json({ error: "Unknown link" }, { status: 404 });
  if (!body.branch || !body.category) {
    return NextResponse.json({ error: "Missing branch or category" }, { status: 400 });
  }

  const result = createTicket({
    vendorId: vendor.id,
    branch: body.branch,
    category: body.category,
    fields: body.fields ?? {},
  });

  return NextResponse.json(result);
}
