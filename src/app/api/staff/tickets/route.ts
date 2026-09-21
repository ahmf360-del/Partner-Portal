import { NextRequest, NextResponse } from "next/server";
import { getSessionStaffId } from "@/lib/session";
import { getStaffById } from "@/lib/staff";
import { listTicketsForTeam } from "@/lib/tickets";

export async function GET(request: NextRequest) {
  const staffId = getSessionStaffId(request);
  const staff = staffId ? getStaffById(staffId) : null;
  if (!staff) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const tickets = listTicketsForTeam(staff.team);
  return NextResponse.json({ tickets });
}
