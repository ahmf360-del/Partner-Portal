"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDateTime, timeUntil } from "@/lib/format";
import { CATEGORY_LABEL } from "@/lib/types";
import type { Ticket } from "@/lib/types";
import { Button, Card, Pill } from "@/components/ui/primitives";

function statusPill(ticket: Ticket) {
  if (ticket.status === "resolved") return <Pill tone="good">Resolved</Pill>;
  const overdue = new Date(ticket.slaDueAt).getTime() < Date.now();
  if (overdue) return <Pill tone="critical">SLA breached</Pill>;
  return <Pill tone={ticket.status === "in_progress" ? "brand" : "neutral"}>
    {ticket.status === "in_progress" ? "In progress" : "Received"}
  </Pill>;
}

function Stars({ ticket, onRate }: { ticket: Ticket; onRate: (rating: number) => void }) {
  if (ticket.rating) {
    return <p className="text-xs text-ink-soft">You rated this {ticket.rating}/5 — thanks!</p>;
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-soft">How did we do?</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onRate(n)}
            className="text-lg leading-none text-brand hover:scale-110 transition"
            aria-label={`Rate ${n} of 5`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export function StatusView({ token }: { token: string }) {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets?token=${token}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setError(null);
    } catch {
      setError("Couldn't load your tickets — check your connection and try again.");
    }
  }, [token]);

  useEffect(() => {
    // Fetch-on-mount for this viewer's tickets — nothing to subscribe to.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function reopen(id: number) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/tickets/${id}/reopen`, { method: "POST" });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setError("Couldn't reopen that ticket — try again in a moment.");
    } finally {
      setBusyId(null);
    }
  }

  async function rate(id: number, rating: number) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/tickets/${id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setError("Couldn't save your rating — try again in a moment.");
    } finally {
      setBusyId(null);
    }
  }

  if (tickets === null) {
    return (
      <p className="text-sm text-ink-soft">
        {error ?? "Loading your tickets…"}
      </p>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-ink-soft">No requests yet — anything you submit will show up here.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {error && (
        <p className="rounded-lg bg-critical-soft px-3.5 py-2.5 text-xs font-medium text-critical">{error}</p>
      )}
      {tickets.map((t) => (
        <Card key={t.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold">{t.code}</span>
                {statusPill(t)}
                {t.escalated && <Pill tone="warn">With account manager</Pill>}
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                {CATEGORY_LABEL[t.category]} · {t.branch} · filed {formatDateTime(t.createdAt)}
              </p>
            </div>
            <span className="text-xs font-medium text-ink-soft">
              {t.status === "resolved" ? `resolved ${t.resolvedAt ? formatDateTime(t.resolvedAt) : ""}` : timeUntil(t.slaDueAt)}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
            {t.status === "resolved" ? (
              <Stars ticket={t} onRate={(r) => rate(t.id, r)} />
            ) : (
              <span className="text-xs text-ink-soft">{t.owningTeam}{t.reopenedCount > 0 ? ` · reopened ${t.reopenedCount}×` : ""}</span>
            )}
            {t.status === "resolved" && (
              <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => reopen(t.id)} disabled={busyId === t.id}>
                Not actually fixed? Reopen
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
