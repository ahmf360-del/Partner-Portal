"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime, timeUntil } from "@/lib/format";
import { dictionary } from "@/lib/i18n/dictionary";
import type { TicketWithVendor } from "@/lib/types";
import { Button, Card, Pill, TextArea } from "@/components/ui/primitives";
import { Logo } from "@/components/brand/Logo";
import { TicketFieldsView } from "@/components/staff/TicketFieldsView";

const en = dictionary.en;

type Filter = "open" | "escalated" | "resolved" | "all";

function dueLabel(ticket: TicketWithVendor): { text: string; overdue: boolean } {
  if (ticket.status === "resolved") return { text: `resolved ${ticket.resolvedAt ? formatDateTime(ticket.resolvedAt) : ""}`, overdue: false };
  const { label, overdue } = timeUntil(ticket.slaDueAt);
  return { text: overdue ? `${label} overdue` : `due in ${label}`, overdue };
}

function TicketRow({ ticket, active, onClick }: { ticket: TicketWithVendor; active: boolean; onClick: () => void }) {
  const due = dueLabel(ticket);
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border p-3.5 text-start transition ${
        active ? "border-brand bg-brand-soft/30" : "border-line bg-white hover:border-brand"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold">{ticket.code}</span>
        {ticket.status === "resolved" ? (
          <Pill tone="good">Resolved</Pill>
        ) : due.overdue ? (
          <Pill tone="critical">Breached</Pill>
        ) : (
          <Pill tone={ticket.status === "in_progress" ? "brand" : "neutral"}>{ticket.status === "in_progress" ? "In progress" : "New"}</Pill>
        )}
      </div>
      <p className="mt-1 text-sm font-medium">{ticket.vendorName} · {ticket.branch}</p>
      <p className="text-xs text-ink-soft">{en[`category.${ticket.category}.label`]} · {due.text}</p>
      {ticket.escalated && <Pill tone="warn">Escalated</Pill>}
    </button>
  );
}

export function StaffQueue({ staff }: { staff: { name: string; team: string } }) {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketWithVendor[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("open");
  const [error, setError] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/tickets");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTickets(data.tickets ?? []);
    } catch {
      setError("Couldn't load the queue — check your connection and try again.");
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount — nothing to subscribe to.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!tickets) return [];
    const list = tickets.filter((t) => {
      if (filter === "open") return t.status !== "resolved";
      if (filter === "escalated") return t.escalated;
      if (filter === "resolved") return t.status === "resolved";
      return true;
    });
    return [...list].sort((a, b) => {
      if (a.escalated !== b.escalated) return a.escalated ? -1 : 1;
      return new Date(a.slaDueAt).getTime() - new Date(b.slaDueAt).getTime();
    });
  }, [tickets, filter]);

  const selected = tickets?.find((t) => t.id === selectedId) ?? null;

  async function logout() {
    await fetch("/api/staff/logout", { method: "POST" });
    router.refresh();
  }

  async function send(resolve: boolean) {
    if (!selected) return;
    if (!replyBody.trim() && !resolve) return;
    setSending(true);
    try {
      const res = await fetch(`/api/staff/tickets/${selected.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody.trim() || undefined, resolve }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTickets((prev) => prev?.map((t) => (t.id === selected.id ? { ...t, ...data.ticket } : t)) ?? null);
      setReplyBody("");
    } catch {
      setError("Couldn't send that — try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  const counts = useMemo(() => {
    if (!tickets) return { open: 0, escalated: 0 };
    return {
      open: tickets.filter((t) => t.status !== "resolved").length,
      escalated: tickets.filter((t) => t.escalated).length,
    };
  }, [tickets]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-5 px-5 py-6 lg:px-10">
      <header className="flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <div className="text-end">
            <p className="text-sm font-semibold">{staff.team}</p>
            <p className="text-xs text-ink-soft">{staff.name}</p>
          </div>
          <button onClick={logout} className="text-xs font-semibold text-ink-soft hover:text-brand">
            Log out
          </button>
        </div>
      </header>

      {error && <p className="rounded-lg bg-critical-soft px-3.5 py-2.5 text-xs font-medium text-critical">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <div className={`flex flex-col gap-3 ${selected ? "hidden lg:flex" : ""}`}>
          <nav className="flex gap-1 rounded-xl bg-brand-soft/40 p-1">
            {([
              ["open", `Open (${counts.open})`],
              ["escalated", `Escalated (${counts.escalated})`],
              ["resolved", "Resolved"],
              ["all", "All"],
            ] as [Filter, string][]).map(([f, label]) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                  filter === f ? "bg-white text-brand-dark shadow-sm" : "text-ink-soft"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {tickets === null ? (
            <p className="text-sm text-ink-soft">Loading…</p>
          ) : filtered.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-ink-soft">Nothing here right now.</p>
            </Card>
          ) : (
            <div className="grid gap-2">
              {filtered.map((t) => (
                <TicketRow key={t.id} ticket={t} active={t.id === selectedId} onClick={() => setSelectedId(t.id)} />
              ))}
            </div>
          )}
        </div>

        {selected ? (
          <Card className="p-6">
            <button onClick={() => setSelectedId(null)} className="mb-3 text-xs font-semibold text-ink-soft hover:text-brand lg:hidden">
              ← Back to queue
            </button>

            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{selected.code}</span>
                  {selected.status === "resolved" && <Pill tone="good">Resolved</Pill>}
                  {selected.escalated && <Pill tone="warn">Escalated{selected.escalationReason ? ` — ${selected.escalationReason.replace(/_/g, " ")}` : ""}</Pill>}
                  {selected.reopenedCount > 0 && <Pill tone="critical">Reopened {selected.reopenedCount}×</Pill>}
                </div>
                <p className="mt-1 text-sm text-ink-soft">
                  {selected.vendorName} · {selected.branch} · filed {formatDateTime(selected.createdAt)}
                </p>
              </div>
              <span className="text-xs font-medium text-ink-soft">{dueLabel(selected).text}</span>
            </div>

            <div className="mt-4 rounded-lg border border-line p-3.5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {en[`category.${selected.category}.label`]}
              </p>
              <TicketFieldsView category={selected.category} fields={selected.fields} />
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Conversation</p>
              <div className="flex flex-col gap-2">
                {selected.messages.length === 0 && <p className="text-xs text-ink-soft">No replies yet.</p>}
                {selected.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg px-3 py-2 text-sm ${m.authorType === "staff" ? "bg-brand-soft/30" : "bg-line/40"}`}
                  >
                    <p className="text-xs font-semibold text-ink-soft">
                      {m.authorName} · {formatDateTime(m.createdAt)}
                    </p>
                    <p className="mt-0.5">{m.body}</p>
                  </div>
                ))}
              </div>

              <TextArea
                className="mt-3"
                rows={3}
                placeholder="Write a reply the vendor will see…"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button onClick={() => send(false)} disabled={sending || !replyBody.trim()}>
                  {sending ? "Sending…" : "Send reply"}
                </Button>
                <Button variant="secondary" onClick={() => send(true)} disabled={sending || selected.status === "resolved"}>
                  {replyBody.trim() ? "Reply & resolve" : "Mark resolved"}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="hidden items-center justify-center p-10 text-center lg:flex">
            <p className="text-sm text-ink-soft">Pick a ticket from the queue to see the details and reply.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
