import { db } from "./db";
import { ticketCode } from "./format";
import { generateReadablePassword, hashPassword, verifyPassword } from "./password";
import { OWNING_TEAM, SLA_HOURS, THRESHOLDS } from "./config";
import type {
  Category,
  MenuLineItem,
  Ticket,
  TicketFields,
  TicketMessage,
  TicketStatus,
  TicketWithVendor,
  Vendor,
} from "./types";

interface VendorRow {
  id: number;
  username: string;
  password_hash: string;
  name: string;
  phone: string;
  branches: string;
  portfolio_tier: string;
  account_manager_name: string;
}

function vendorFromRow(row: VendorRow): Vendor {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    phone: row.phone,
    branches: JSON.parse(row.branches),
    portfolioTier: row.portfolio_tier as Vendor["portfolioTier"],
    accountManagerName: row.account_manager_name,
  };
}

export function getVendorById(id: number): Vendor | null {
  const row = db.prepare("SELECT * FROM vendors WHERE id = ?").get(id) as VendorRow | undefined;
  return row ? vendorFromRow(row) : null;
}

/** Verifies credentials and returns the vendor, or null if either is wrong. */
export function verifyVendorLogin(username: string, password: string): Vendor | null {
  const row = db
    .prepare("SELECT * FROM vendors WHERE username = ?")
    .get(username.trim().toLowerCase()) as VendorRow | undefined;
  if (!row || !verifyPassword(password, row.password_hash)) return null;
  return vendorFromRow(row);
}

/** Generates a new random password for a vendor and returns it in the clear
 * (this is the only time it's ever available in plaintext — only the hash
 * is stored). Used by the account-manager tool to hand out/reset access. */
export function resetVendorPassword(vendorId: number): string {
  const newPassword = generateReadablePassword();
  db.prepare("UPDATE vendors SET password_hash = ? WHERE id = ?").run(hashPassword(newPassword), vendorId);
  return newPassword;
}

export function listVendors(): Vendor[] {
  const rows = db.prepare("SELECT * FROM vendors ORDER BY id").all() as VendorRow[];
  return rows.map(vendorFromRow);
}

interface TicketRow {
  id: number;
  code: string;
  vendor_id: number;
  branch: string;
  category: string;
  fields: string;
  status: string;
  owning_team: string;
  auto_applied: number;
  escalated: number;
  escalation_reason: string | null;
  reopened_count: number;
  rating: number | null;
  created_at: string;
  sla_due_at: string;
  resolved_at: string | null;
}

interface MessageRow {
  id: number;
  ticket_id: number;
  author_type: string;
  author_name: string;
  body: string;
  created_at: string;
}

function messageFromRow(row: MessageRow): TicketMessage {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    authorType: row.author_type as TicketMessage["authorType"],
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

export function getMessagesForTicket(ticketId: number): TicketMessage[] {
  const rows = db
    .prepare("SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC")
    .all(ticketId) as MessageRow[];
  return rows.map(messageFromRow);
}

export function addMessage(
  ticketId: number,
  authorType: TicketMessage["authorType"],
  authorName: string,
  body: string
): TicketMessage {
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(
      "INSERT INTO ticket_messages (ticket_id, author_type, author_name, body, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    .run(ticketId, authorType, authorName, body, createdAt);
  return { id: result.lastInsertRowid as number, ticketId, authorType, authorName, body, createdAt };
}

function ticketFromRow(row: TicketRow): Ticket {
  return {
    id: row.id,
    code: row.code,
    vendorId: row.vendor_id,
    branch: row.branch,
    category: row.category as Category,
    fields: JSON.parse(row.fields),
    status: row.status as TicketStatus,
    owningTeam: row.owning_team,
    autoApplied: !!row.auto_applied,
    escalated: !!row.escalated,
    escalationReason: row.escalation_reason,
    reopenedCount: row.reopened_count,
    rating: row.rating,
    createdAt: row.created_at,
    slaDueAt: row.sla_due_at,
    resolvedAt: row.resolved_at,
    messages: getMessagesForTicket(row.id),
  };
}

function addHours(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

/** Decides auto-apply + SLA hours for a single Menu & Content line item. */
function resolveMenuItem(item: MenuLineItem): { autoApplied: boolean; slaHours: number } {
  switch (item.changeType) {
    case "price_change": {
      const current = parseFloat(item.currentPrice ?? "");
      const next = parseFloat(item.newPrice ?? "");
      const movePct =
        Number.isFinite(current) && current > 0 && Number.isFinite(next)
          ? (Math.abs(next - current) / current) * 100
          : Infinity;
      const autoApplied = movePct <= THRESHOLDS.priceChangeAutoApplyPct;
      return {
        autoApplied,
        slaHours: autoApplied
          ? SLA_HOURS.menu.price_change_auto
          : SLA_HOURS.menu.price_change_review,
      };
    }
    case "remove_permanent":
      return { autoApplied: false, slaHours: SLA_HOURS.menu.remove_permanent };
    case "add_item":
      return { autoApplied: false, slaHours: SLA_HOURS.menu.add_item };
    case "update_content":
      return { autoApplied: false, slaHours: SLA_HOURS.menu.update_content };
    case "full_menu_price_change":
      return { autoApplied: false, slaHours: SLA_HOURS.menu.full_menu_price_change };
  }
}

interface CreateTicketInput {
  vendorId: number;
  branch: string;
  category: Category;
  fields: TicketFields;
}

interface CreateTicketResult {
  autoApplied: boolean;
  escalated: boolean;
  escalationReason: string | null;
}

function resolveCategory(
  category: Category,
  fields: TicketFields
): { autoApplied: boolean; slaHours: number; escalated: boolean; escalationReason: string | null } {
  const escalated = false;
  const escalationReason = null;

  if (category === "discounts") {
    const pct = parseFloat(fields.discountPercent ?? "");
    const autoApplied = Number.isFinite(pct) && pct <= THRESHOLDS.discountAutoApprovePct;
    return { autoApplied, slaHours: SLA_HOURS.discounts, escalated, escalationReason };
  }

  if (category === "menu") {
    const items = fields.items ?? [];
    const resolved = items.map((item) => ({ ...item, ...resolveMenuItem(item) }));
    fields.items = resolved;
    const autoApplied = resolved.length > 0 && resolved.every((i) => i.autoApplied);
    const slaHours = resolved.length
      ? Math.min(...resolved.map((i) => i.slaHours))
      : SLA_HOURS.other;
    return { autoApplied, slaHours, escalated, escalationReason };
  }

  if (category === "finance") return { autoApplied: false, slaHours: SLA_HOURS.finance, escalated, escalationReason };
  if (category === "tech") return { autoApplied: false, slaHours: SLA_HOURS.tech, escalated, escalationReason };
  return { autoApplied: false, slaHours: SLA_HOURS.other, escalated, escalationReason };
}

export function createTicket(input: CreateTicketInput): { ticket: Ticket } & CreateTicketResult {
  const { autoApplied, slaHours, escalated, escalationReason } = resolveCategory(
    input.category,
    input.fields
  );

  const now = new Date().toISOString();
  const slaDueAt = addHours(slaHours);
  const status: TicketStatus = autoApplied ? "resolved" : "received";
  const owningTeam = OWNING_TEAM[input.category];

  const insert = db.prepare(`
    INSERT INTO tickets
      (vendor_id, branch, category, fields, status, owning_team, auto_applied, escalated, escalation_reason, created_at, sla_due_at, resolved_at)
    VALUES
      (@vendorId, @branch, @category, @fields, @status, @owningTeam, @autoApplied, @escalated, @escalationReason, @createdAt, @slaDueAt, @resolvedAt)
  `);

  const result = insert.run({
    vendorId: input.vendorId,
    branch: input.branch,
    category: input.category,
    fields: JSON.stringify(input.fields),
    status,
    owningTeam,
    autoApplied: autoApplied ? 1 : 0,
    escalated: escalated ? 1 : 0,
    escalationReason,
    createdAt: now,
    slaDueAt,
    resolvedAt: autoApplied ? now : null,
  });

  const id = result.lastInsertRowid as number;
  const code = ticketCode(id);
  db.prepare("UPDATE tickets SET code = ? WHERE id = ?").run(code, id);

  const row = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as TicketRow;
  return { ticket: ticketFromRow(row), autoApplied, escalated, escalationReason };
}

export function listTicketsForVendor(vendorId: number): Ticket[] {
  const rows = db
    .prepare("SELECT * FROM tickets WHERE vendor_id = ? ORDER BY created_at DESC")
    .all(vendorId) as TicketRow[];
  return rows.map(ticketFromRow);
}

export function getTicketById(id: number): Ticket | null {
  const row = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as TicketRow | undefined;
  return row ? ticketFromRow(row) : null;
}

export function reopenTicket(id: number, vendorId: number): Ticket | null {
  const ticket = getTicketById(id);
  if (!ticket || ticket.vendorId !== vendorId) return null;
  if (ticket.status !== "resolved") return ticket;

  const newReopenedCount = ticket.reopenedCount + 1;
  const escalated = ticket.escalated || newReopenedCount > 1;
  const escalationReason = ticket.escalated
    ? ticket.escalationReason
    : newReopenedCount > 1
    ? "reopened_multiple"
    : ticket.escalationReason;

  db.prepare(`
    UPDATE tickets
    SET status = 'in_progress', reopened_count = ?, resolved_at = NULL, rating = NULL,
        escalated = ?, escalation_reason = ?
    WHERE id = ?
  `).run(newReopenedCount, escalated ? 1 : 0, escalationReason, id);

  return getTicketById(id);
}

export function rateTicket(id: number, rating: number, vendorId: number): Ticket | null {
  const ticket = getTicketById(id);
  if (!ticket || ticket.vendorId !== vendorId) return null;
  if (ticket.status !== "resolved") return ticket;
  db.prepare("UPDATE tickets SET rating = ? WHERE id = ?").run(rating, id);
  return getTicketById(id);
}

/** Vendor-initiated fallback for a stalled ticket — the account manager is
 * never the first point of contact, only a backstop when nobody's answered. */
export function escalateTicket(id: number, vendorId: number): Ticket | null {
  const ticket = getTicketById(id);
  if (!ticket || ticket.vendorId !== vendorId) return null;
  if (ticket.status === "resolved" || ticket.escalated) return ticket;
  db.prepare("UPDATE tickets SET escalated = 1, escalation_reason = ? WHERE id = ?").run(
    "vendor_requested",
    id
  );
  return getTicketById(id);
}

function withVendorName(ticket: Ticket): TicketWithVendor {
  const vendor = getVendorById(ticket.vendorId);
  return { ...ticket, vendorName: vendor?.name ?? "Unknown vendor" };
}

/** All tickets routed to a team's queue — every status, newest first. Staff
 * triage by status/urgency themselves rather than the API pre-filtering. */
export function listTicketsForTeam(team: string): TicketWithVendor[] {
  const rows = db
    .prepare("SELECT * FROM tickets WHERE owning_team = ? ORDER BY created_at DESC")
    .all(team) as TicketRow[];
  return rows.map(ticketFromRow).map(withVendorName);
}

/** Ownership-scoped read: returns null (not the ticket) if it belongs to a
 * different team, so a staff account can't view another team's ticket by
 * guessing an id. */
export function getTicketForTeam(id: number, team: string): TicketWithVendor | null {
  const ticket = getTicketById(id);
  if (!ticket || ticket.owningTeam !== team) return null;
  return withVendorName(ticket);
}

/** A staff reply: posts a message (if any body given) and/or transitions
 * status — replying to an untouched ticket moves it to "in progress";
 * `resolve: true` closes it outright. Scoped to the staff member's own team. */
export function replyToTicket(
  id: number,
  team: string,
  authorName: string,
  body: string | null,
  resolve: boolean
): Ticket | null {
  const ticket = getTicketForTeam(id, team);
  if (!ticket) return null;

  if (body) addMessage(id, "staff", authorName, body);

  if (resolve) {
    db.prepare("UPDATE tickets SET status = 'resolved', resolved_at = ? WHERE id = ?").run(
      new Date().toISOString(),
      id
    );
  } else if (ticket.status === "received") {
    db.prepare("UPDATE tickets SET status = 'in_progress' WHERE id = ?").run(id);
  }

  return getTicketById(id);
}
