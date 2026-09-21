"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDateTime, timeUntil } from "@/lib/format";
import type { Ticket } from "@/lib/types";
import { Button, Card, Pill } from "@/components/ui/primitives";
import { useLocale } from "@/components/i18n/LocaleProvider";

function StatusPill({ ticket, overdue }: { ticket: Ticket; overdue: boolean }) {
  const { t } = useLocale();
  if (ticket.status === "resolved") return <Pill tone="good">{t("status.resolved")}</Pill>;
  if (overdue) return <Pill tone="critical">{t("status.breached")}</Pill>;
  return (
    <Pill tone={ticket.status === "in_progress" ? "brand" : "neutral"}>
      {ticket.status === "in_progress" ? t("status.inProgress") : t("status.received")}
    </Pill>
  );
}

function Stars({ ticket, onRate }: { ticket: Ticket; onRate: (rating: number) => void }) {
  const { t } = useLocale();
  if (ticket.rating) {
    return <p className="text-xs text-ink-soft">{t("status.rated", { n: ticket.rating })}</p>;
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-soft">{t("status.rateePrompt")}</span>
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

export function StatusView() {
  const { t } = useLocale();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/tickets");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setError(null);
    } catch {
      setError(t("status.error.load"));
    }
  }, [t]);

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
      setError(t("status.error.reopen"));
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
      setError(t("status.error.rate"));
    } finally {
      setBusyId(null);
    }
  }

  if (tickets === null) {
    return <p className="text-sm text-ink-soft">{error ?? t("status.loading")}</p>;
  }

  if (tickets.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-ink-soft">{t("status.empty")}</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {error && (
        <p className="rounded-lg bg-critical-soft px-3.5 py-2.5 text-xs font-medium text-critical">{error}</p>
      )}
      {tickets.map((tk) => {
        const due = timeUntil(tk.slaDueAt);
        return (
          <Card key={tk.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{tk.code}</span>
                  <StatusPill ticket={tk} overdue={due.overdue} />
                  {tk.escalated && <Pill tone="warn">{t("status.withAm")}</Pill>}
                </div>
                <p className="mt-1 text-sm text-ink-soft">
                  {t(`category.${tk.category}.label`)} · {tk.branch} · {t("status.filed", { date: formatDateTime(tk.createdAt) })}
                </p>
              </div>
              <span className="text-xs font-medium text-ink-soft">
                {tk.status === "resolved"
                  ? t("status.resolvedAt", { date: tk.resolvedAt ? formatDateTime(tk.resolvedAt) : "" })
                  : t(due.overdue ? "status.overdue" : "status.dueIn", { x: due.label })}
              </span>
            </div>

            {tk.messages.length > 0 && (
              <div className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("status.replies")}</p>
                {tk.messages.map((m) => (
                  <div key={m.id} className="rounded-lg bg-brand-soft/25 px-3 py-2 text-sm">
                    <p className="text-xs font-semibold text-ink-soft">{t("status.teamReply")} · {formatDateTime(m.createdAt)}</p>
                    <p className="mt-0.5">{m.body}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
              {tk.status === "resolved" ? (
                <Stars ticket={tk} onRate={(r) => rate(tk.id, r)} />
              ) : (
                <span className="text-xs text-ink-soft">
                  {tk.owningTeam}
                  {tk.reopenedCount > 0 ? ` · ${t("status.reopenedCount", { n: tk.reopenedCount })}` : ""}
                </span>
              )}
              {tk.status === "resolved" && (
                <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => reopen(tk.id)} disabled={busyId === tk.id}>
                  {t("status.reopen")}
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
