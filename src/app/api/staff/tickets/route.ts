import { NextRequest, NextResponse } from "next/server";
import { getSessionStaffId } from "@/lib/session";
import { OWNING_TEAM } from "@/lib/config";
import { listTicketsForTeam } from "@/lib/tickets";

const VALID_TEAMS: string[] = Object.values(OWNING_TEAM);

export async function GET(request: NextRequest) {
  const staffId = getSessionStaffId(request);
  if (!staffId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const team = request.nextUrl.searchParams.get("team");
  if (!team || !VALID_TEAMS.includes(team)) {
    return NextResponse.json({ error: "Unknown team" }, { status: 400 });
  }

  const tickets = listTicketsForTeam(team);
  return NextResponse.json({ tickets });
}
