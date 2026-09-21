import { NextRequest, NextResponse } from "next/server";
import { getSessionStaffId } from "@/lib/session";
import { getStaffById } from "@/lib/staff";
import { getTicketForTeam } from "@/lib/tickets";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const staffId = getSessionStaffId(request);
  const staff = staffId ? getStaffById(staffId) : null;
  if (!staff) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const ticket = getTicketForTeam(Number(id), staff.team);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  return NextResponse.json({ ticket });
}
