"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatDateTime, timeUntil } from "@/lib/format";
import type { Category, TicketWithVendor } from "@/lib/types";
import { OWNING_TEAM } from "@/lib/config";
import { Button, Card, Pill, TextArea } from "@/components/ui/primitives";
import { Logo } from "@/components/brand/Logo";
import { CategoryIcon } from "@/components/portal/CategoryIcon";
import { TicketFieldsView } from "@/components/staff/TicketFieldsView";
import { LocaleToggle, useLocale } from "@/components/i18n/LocaleProvider";
import type { TranslationKey } from "@/lib/i18n/dictionary";

type Filter = "open" | "escalated" | "resolved" | "all";

// Staff share one login across every department — this is the sidebar that
// picks which team's queue to load, rather than a login tied to a team. The
// labels reuse the vendor-facing category names exactly, so a ticket filed
// under "Discounts & Offers" shows up under a tab of the same name here.
const DEPARTMENTS: { team: string; labelKey: TranslationKey; category: Category }[] = [
  { team: OWNING_TEAM.finance, labelKey: "category.finance.label", category: "finance" },
  { team: OWNING_TEAM.discounts, labelKey: "category.discounts.label", category: "discounts" },
  { team: OWNING_TEAM.tech, labelKey: "category.tech.label", category: "tech" },
  { team: OWNING_TEAM.menu, labelKey: "category.menu.label", category: "menu" },
  { team: OWNING_TEAM.other, labelKey: "category.other.label", category: "other" },
];

function escalationReasonText(t: (k: TranslationKey) => string, reason: string | null): string | null {
  if (reason === "vendor_requested") return t("team.escalationReason.vendor_requested");
  if (reason === "reopened_multiple") return t("team.escalationReason.reopened_multiple");
  return reason;
}

function useDueLabel() {
  const { t } = useLocale();
  return (ticket: TicketWithVendor) => {
    if (ticket.status === "resolved") {
      return { text: t("status.resolvedAt", { date: ticket.resolvedAt ? formatDateTime(ticket.resolvedAt) : "" }), overdue: false };
    }
    const due = timeUntil(ticket.slaDueAt);
    return { text: t(due.overdue ? "status.overdue" : "status.dueIn", { x: due.label }), overdue: due.overdue };
  };
}

function TicketRow({ ticket, active, onClick }: { ticket: TicketWithVendor; active: boolean; onClick: () => void }) {
  const { t } = useLocale();
  const dueLabel = useDueLabel();
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
          <Pill tone="good">{t("status.resolved")}</Pill>
        ) : due.overdue ? (
          <Pill tone="critical">{t("status.breached")}</Pill>
        ) : (
          <Pill tone={ticket.status === "in_progress" ? "brand" : "neutral"}>
            {ticket.status === "in_progress" ? t("status.inProgress") : t("status.received")}
          </Pill>
        )}
      </div>
      <p className="mt-1.5 flex items-center gap-2 text-sm font-medium">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
          <CategoryIcon category={ticket.category} className="h-3.5 w-3.5" />
        </span>
        {ticket.vendorName} · {ticket.restaurant} · {ticket.branch}
      </p>
      <p className="mt-1 text-xs text-ink-soft">{t(`category.${ticket.category}.label`)} · {due.text}</p>
      {ticket.escalated && (
        <div className="mt-1.5">
          <Pill tone="warn">{t("team.badge.escalated")}</Pill>
        </div>
      )}
    </button>
  );
}

export function StaffQueue({ staff }: { staff: { name: string } }) {
  const { t } = useLocale();
  const router = useRouter();
  const dueLabel = useDueLabel();
  const [team, setTeam] = useState<string>(DEPARTMENTS[0].team);
  const [tickets, setTickets] = useState<TicketWithVendor[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("open");
  const [error, setError] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff/tickets?team=${encodeURIComponent(team)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTickets(data.tickets ?? []);
    } catch {
      setError(t("team.error.load"));
    }
  }, [t, team]);

  useEffect(() => {
    // Re-fetch whenever the selected department changes, and clear any
    // selection from the previous department's list.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedId(null);
    setTickets(null);
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!tickets) return [];
    const list = tickets.filter((tk) => {
      if (filter === "open") return tk.status !== "resolved";
      if (filter === "escalated") return tk.escalated;
      if (filter === "resolved") return tk.status === "resolved";
      return true;
    });
    return [...list].sort((a, b) => {
      if (a.escalated !== b.escalated) return a.escalated ? -1 : 1;
      return new Date(a.slaDueAt).getTime() - new Date(b.slaDueAt).getTime();
    });
  }, [tickets, filter]);

  const selected = tickets?.find((tk) => tk.id === selectedId) ?? null;

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
      setTickets((prev) => prev?.map((tk) => (tk.id === selected.id ? { ...tk, ...data.ticket } : tk)) ?? null);
      setReplyBody("");
    } catch {
      setError(t("team.error.send"));
    } finally {
      setSending(false);
    }
  }

  const counts = useMemo(() => {
    if (!tickets) return { open: 0, escalated: 0 };
    return {
      open: tickets.filter((tk) => tk.status !== "resolved").length,
      escalated: tickets.filter((tk) => tk.escalated).length,
    };
  }, [tickets]);

  return (
    <div className="flex min-h-dvh">
      <aside className={`relative hidden w-64 shrink-0 flex-col overflow-hidden bg-brand-dark px-5 py-6 lg:flex ${selected ? "lg:hidden xl:flex" : ""}`}>
        <Image
          src="/brand/logo-mark.png"
          alt=""
          width={200}
          height={200}
          aria-hidden
          className="pointer-events-none absolute end-[-70px] top-[-70px] h-[320px] w-[320px] opacity-[0.07]"
        />

        <div className="relative z-10 flex items-center justify-between">
          <Logo variant="onBrand" size="sm" />
        </div>

        <p className="relative z-10 mt-8 text-xs font-semibold uppercase tracking-wide text-white/50">
          {t("team.rail.departments")}
        </p>
        <nav className="relative z-10 mt-3 flex flex-1 flex-col gap-1.5">
          {DEPARTMENTS.map((d) => {
            const active = team === d.team;
            return (
              <button
                key={d.team}
                onClick={() => setTeam(d.team)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-start text-sm font-semibold transition ${
                  active ? "bg-white text-brand-dark shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                    active ? "bg-brand-soft text-brand-dark" : "bg-white/10 text-white"
                  }`}
                >
                  <CategoryIcon category={d.category} className="h-4 w-4" />
                </span>
                {t(d.labelKey)}
              </button>
            );
          })}
        </nav>

        <div className="relative z-10 flex flex-col gap-3 border-t border-white/10 pt-4">
          <LocaleToggle onBrand />
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-white/80">{staff.name}</p>
            <button onClick={logout} className="text-xs font-semibold text-white/60 hover:text-white">
              {t("rail.logout")}
            </button>
          </div>
        </div>
      </aside>

      <div className="mx-auto flex w-full flex-1 flex-col gap-5 px-5 py-6 lg:max-w-6xl lg:px-8">
        <header className="flex items-center justify-between lg:hidden">
          <Logo />
          <div className="flex items-center gap-3">
            <LocaleToggle />
            <p className="text-sm font-semibold">{staff.name}</p>
            <button onClick={logout} className="text-xs font-semibold text-ink-soft hover:text-brand">
              {t("rail.logout")}
            </button>
          </div>
        </header>

        <nav className={`flex gap-2 overflow-x-auto pb-1 lg:hidden ${selected ? "hidden" : ""}`}>
          {DEPARTMENTS.map((d) => (
            <button
              key={d.team}
              onClick={() => setTeam(d.team)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                team === d.team ? "bg-brand-dark text-white" : "bg-brand-soft/40 text-ink-soft"
              }`}
            >
              <CategoryIcon category={d.category} className="h-3.5 w-3.5" />
              {t(d.labelKey)}
            </button>
          ))}
        </nav>

        {error && <p className="rounded-lg bg-critical-soft px-3.5 py-2.5 text-xs font-medium text-critical">{error}</p>}

        <div className="grid flex-1 gap-5 lg:grid-cols-[380px_1fr]">
          <div className={`flex flex-col gap-3 ${selected ? "hidden lg:flex" : ""}`}>
          <nav className="flex gap-1 rounded-xl bg-brand-soft/40 p-1">
            {([
              ["open", `${t("team.tab.open")} (${counts.open})`],
              ["escalated", `${t("team.tab.escalated")} (${counts.escalated})`],
              ["resolved", t("team.tab.resolved")],
              ["all", t("team.tab.all")],
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
            <p className="text-sm text-ink-soft">{t("team.queue.loading")}</p>
          ) : filtered.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-ink-soft">{t("team.queue.empty")}</p>
            </Card>
          ) : (
            <div className="grid gap-2">
              {filtered.map((tk) => (
                <TicketRow key={tk.id} ticket={tk} active={tk.id === selectedId} onClick={() => setSelectedId(tk.id)} />
              ))}
            </div>
          )}
        </div>

        {selected ? (
          <Card className="p-6">
            <button onClick={() => setSelectedId(null)} className="mb-3 text-xs font-semibold text-ink-soft hover:text-brand lg:hidden">
              {t("team.back")}
            </button>

            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{selected.code}</span>
                  {selected.status === "resolved" && <Pill tone="good">{t("status.resolved")}</Pill>}
                  {selected.escalated && (
                    <Pill tone="warn">
                      {t("team.badge.escalated")}
                      {selected.escalationReason ? ` — ${escalationReasonText(t, selected.escalationReason)}` : ""}
                    </Pill>
                  )}
                  {selected.reopenedCount > 0 && <Pill tone="critical">{t("status.reopenedCount", { n: selected.reopenedCount })}</Pill>}
                </div>
                <p className="mt-1 text-sm text-ink-soft">
                  {selected.vendorName} · {selected.restaurant} · {selected.branch} · {t("status.filed", { date: formatDateTime(selected.createdAt) })}
                </p>
              </div>
              <span className="text-xs font-medium text-ink-soft">{dueLabel(selected).text}</span>
            </div>

            <div className="mt-4 rounded-lg border border-line p-3.5">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
                  <CategoryIcon category={selected.category} className="h-3.5 w-3.5" />
                </span>
                {t(`category.${selected.category}.label`)}
              </p>
              <TicketFieldsView category={selected.category} fields={selected.fields} />
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("team.conversation.heading")}</p>
              <div className="flex flex-col gap-2">
                {selected.messages.length === 0 && <p className="text-xs text-ink-soft">{t("team.conversation.empty")}</p>}
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
                placeholder={t("team.reply.placeholder")}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button onClick={() => send(false)} disabled={sending || !replyBody.trim()}>
                  {sending ? t("team.reply.sending") : t("team.reply.send")}
                </Button>
                <Button variant="secondary" onClick={() => send(true)} disabled={sending || selected.status === "resolved"}>
                  {replyBody.trim() ? t("team.reply.replyResolve") : t("team.reply.resolveOnly")}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="hidden items-center justify-center p-10 text-center lg:flex">
            <p className="text-sm text-ink-soft">{t("team.queue.pick")}</p>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
