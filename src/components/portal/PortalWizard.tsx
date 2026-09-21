"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { BrandRail, RailSteps } from "@/components/brand/BrandRail";
import { VerifyGate } from "@/components/portal/VerifyGate";
import { StatusView } from "@/components/portal/StatusView";
import { CategoryIcon } from "@/components/portal/CategoryIcon";
import { DiscountsForm, FinanceForm, MenuForm, OtherForm, TechForm } from "@/components/portal/CategoryForms";
import { Button, Card, Pill } from "@/components/ui/primitives";
import { CATEGORY_BLURB, CATEGORY_LABEL } from "@/lib/types";
import type { Category, TicketFields } from "@/lib/types";

interface VendorSummary {
  name: string;
  branches: string[];
  maskedPhone: string;
  accountManagerName: string;
}

type Step = "branch" | "category" | "form" | "done";

function requiredFieldsOk(category: Category, branch: string, fields: TicketFields): boolean {
  if (!branch) return false;
  switch (category) {
    case "finance": {
      if (!fields.issueType) return false;
      if (fields.issueType === "report_request") return !!fields.reportType && !!fields.dateRangeStart && !!fields.dateRangeEnd;
      if (fields.issueType === "soa_request") return !!fields.dateRangeStart && !!fields.dateRangeEnd;
      if (fields.issueType === "proof_of_transfer") return !!fields.orderOrInvoiceId && !!fields.dateRangeStart && !!fields.dateRangeEnd;
      return !!fields.orderOrInvoiceId;
    }
    case "discounts":
      return !!fields.campaignType && !!fields.reason && (fields.campaignType === "commercial_terms" || !!fields.discountPercent);
    case "tech":
      return !!fields.issueDescription && !!fields.urgency;
    case "menu":
      return !!fields.items?.length && fields.items.every((i) => i.itemName);
    case "other":
      return !!fields.freeText;
  }
}

export function PortalWizard({ token, vendor }: { token: string; vendor: VendorSummary }) {
  const [verified, setVerified] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"new" | "tickets">("new");
  const [step, setStep] = useState<Step>(vendor.branches.length > 1 ? "branch" : "category");
  const [branch, setBranch] = useState(vendor.branches.length === 1 ? vendor.branches[0] : "");
  const [category, setCategory] = useState<Category | null>(null);
  const [fields, setFields] = useState<TicketFields>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ code: string; autoApplied: boolean; escalated: boolean } | null>(null);

  useEffect(() => {
    // One-time read of a per-viewer localStorage flag; there's no external
    // system to subscribe to here, so a direct setState on mount is fine.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      setVerified(localStorage.getItem(`bf_verified_${token}`) === "1");
    } catch {
      setVerified(false);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [token]);

  function update(patch: Partial<TicketFields>) {
    setFields((f) => ({ ...f, ...patch }));
  }

  function startNew() {
    setStep(vendor.branches.length > 1 ? "branch" : "category");
    setCategory(null);
    setFields({});
    setResult(null);
    setSubmitError(null);
    setTab("new");
  }

  async function submit() {
    if (!category) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, branch, category, fields }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Couldn't submit that — please try again.");
        return;
      }
      setResult({ code: data.ticket.code, autoApplied: data.autoApplied, escalated: data.escalated });
      setStep("done");
    } catch {
      setSubmitError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (verified === null) return null;
  if (!verified) {
    return <VerifyGate token={token} vendorName={vendor.name} maskedPhone={vendor.maskedPhone} onVerified={() => setVerified(true)} />;
  }

  const stepOrder: Step[] = vendor.branches.length > 1 ? ["branch", "category", "form", "done"] : ["category", "form", "done"];
  const stepLabel: Record<Step, string> = { branch: "Choose branch", category: "Pick a category", form: "Add details", done: "Submitted" };
  const currentIndex = stepOrder.indexOf(step);
  const railSteps = stepOrder.map((s, i) => ({
    label: stepLabel[s],
    state: i < currentIndex ? "done" as const : i === currentIndex ? "current" as const : "upcoming" as const,
  }));

  return (
    <div className="flex min-h-dvh">
      <BrandRail
        eyebrow={vendor.accountManagerName}
        title={vendor.name}
        subtitle={tab === "tickets" ? "Every request you've filed, tracked in one place." : "A few quick steps and we'll route this to the right team automatically."}
      >
        {tab === "new" && <RailSteps steps={railSteps} />}
      </BrandRail>

      <div className={`flex flex-1 flex-col px-5 py-8 lg:px-16 lg:py-12 ${tab === "new" ? "lg:justify-center" : ""}`}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 lg:max-w-4xl">
      <header className="flex items-center justify-between lg:hidden">
        <Logo />
        <div className="text-right">
          <p className="text-sm font-semibold">{vendor.name}</p>
          <p className="text-xs text-ink-soft">{vendor.accountManagerName}</p>
        </div>
      </header>

      <nav className="flex gap-1 rounded-xl bg-brand-soft/40 p-1 lg:max-w-sm">
        {(["new", "tickets"] as const).map((t) => (
          <button
            key={t}
            onClick={() => (t === "new" ? startNew() : setTab(t))}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              tab === t ? "bg-white text-brand-dark shadow-sm" : "text-ink-soft"
            }`}
          >
            {t === "new" ? "New request" : "My tickets"}
          </button>
        ))}
      </nav>

      {tab === "tickets" ? (
        <StatusView token={token} />
      ) : (
        <>
          {step === "branch" && (
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold">Which branch is this for?</h2>
              <div className="mt-4 grid gap-2">
                {vendor.branches.map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      setBranch(b);
                      setStep("category");
                    }}
                    className="rounded-xl border border-line bg-white px-4 py-3 text-left text-sm font-medium hover:border-brand"
                  >
                    {b}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {step === "category" && (
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold">What do you need?</h2>
              {branch && <p className="text-xs text-ink-soft">{branch}</p>}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCategory(c);
                      setStep("form");
                    }}
                    className="flex flex-col items-start gap-2.5 rounded-xl border border-line bg-white p-4 text-left hover:border-brand hover:shadow-sm"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
                      <CategoryIcon category={c} className="h-5 w-5" />
                    </span>
                    <span className="font-semibold">{CATEGORY_LABEL[c]}</span>
                    <span className="text-xs text-ink-soft">{CATEGORY_BLURB[c]}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {step === "form" && category && (
            <Card className="p-6">
              <button onClick={() => setStep("category")} className="mb-3 text-xs font-semibold text-ink-soft hover:text-brand">
                ← Back
              </button>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
                  <CategoryIcon category={category} className="h-[18px] w-[18px]" />
                </span>
                <h2 className="font-display text-lg font-bold">{CATEGORY_LABEL[category]}</h2>
              </div>

              <div className="mt-4">
                {category === "finance" && <FinanceForm fields={fields} update={update} />}
                {category === "discounts" && <DiscountsForm fields={fields} update={update} />}
                {category === "tech" && <TechForm fields={fields} update={update} branch={branch} />}
                {category === "menu" && <MenuForm fields={fields} update={update} />}
                {category === "other" && <OtherForm fields={fields} update={update} />}
              </div>

              <label className="mt-5 flex items-start gap-2.5 rounded-xl bg-brand-soft/30 p-3.5">
                <input
                  type="checkbox"
                  checked={!!fields.talkToAccountManager}
                  onChange={(e) => update({ talkToAccountManager: e.target.checked })}
                  className="mt-0.5 h-4 w-4 accent-[var(--bf-magenta)]"
                />
                <span className="text-sm">
                  <span className="font-medium">Skip the queue — talk to {vendor.accountManagerName} directly</span>
                  <br />
                  <span className="text-xs text-ink-soft">Use this if it&apos;s urgent or the usual process doesn&apos;t fit.</span>
                </span>
              </label>

              {submitError && (
                <p className="mt-4 rounded-lg bg-critical-soft px-3.5 py-2.5 text-xs font-medium text-critical">
                  {submitError}
                </p>
              )}

              <Button
                className="mt-5 w-full"
                disabled={!requiredFieldsOk(category, branch, fields) || submitting}
                onClick={submit}
              >
                {submitting ? "Submitting…" : "Submit request"}
              </Button>
            </Card>
          )}

          {step === "done" && result && (
            <Card className="p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-good-soft text-2xl">✓</div>
              <h2 className="font-display text-lg font-bold">Request received</h2>
              <p className="mt-1 font-mono text-sm text-ink-soft">{result.code}</p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {result.autoApplied && <Pill tone="good">Applied automatically</Pill>}
                {result.escalated && <Pill tone="warn">Sent to {vendor.accountManagerName}</Pill>}
              </div>

              <p className="mt-4 text-sm text-ink-soft">
                We&apos;ll message you on WhatsApp as this moves along. You can check status anytime from this same link.
              </p>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button variant="secondary" onClick={startNew}>Submit another</Button>
                <Button onClick={() => setTab("tickets")}>Track my tickets</Button>
              </div>
            </Card>
          )}
        </>
      )}
      </div>
      </div>
    </div>
  );
}
