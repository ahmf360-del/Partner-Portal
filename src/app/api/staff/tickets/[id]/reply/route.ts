import { NextRequest, NextResponse } from "next/server";
import { getSessionStaffId } from "@/lib/session";
import { TEAM_AUTHOR_NAME } from "@/lib/config";
import { getTicketById, replyToTicket } from "@/lib/tickets";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const staffId = getSessionStaffId(request);
  if (!staffId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const { body, resolve } = (await request.json()) as { body?: string; resolve?: boolean };
  if (!body && !resolve) {
    return NextResponse.json({ error: "Nothing to do — write a reply or mark it resolved" }, { status: 400 });
  }

  const existing = getTicketById(Number(id));
  if (!existing) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  const authorName = TEAM_AUTHOR_NAME[existing.owningTeam] ?? existing.owningTeam;

  const ticket = replyToTicket(Number(id), authorName, body?.trim() || null, !!resolve);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  return NextResponse.json({ ticket });
}
