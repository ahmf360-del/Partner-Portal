"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { BrandRail, RailSteps } from "@/components/brand/BrandRail";
import { StatusView } from "@/components/portal/StatusView";
import { CategoryIcon } from "@/components/portal/CategoryIcon";
import { DiscountsForm, FinanceForm, MenuForm, OtherForm, TechForm } from "@/components/portal/CategoryForms";
import { Button, Card, Pill } from "@/components/ui/primitives";
import { LocaleToggle, useLocale } from "@/components/i18n/LocaleProvider";
import { CATEGORIES } from "@/lib/types";
import type { Category, TicketFields } from "@/lib/types";

interface VendorSummary {
  name: string;
  branches: string[];
  accountManagerName: string;
}

type Step = "branch" | "category" | "form" | "done";

function requiredFieldsOk(category: Category, branch: string, fields: TicketFields): boolean {
  if (!branch) return false;
  switch (category) {
    case "finance": {
      if (!fields.issueType) return false;
      if (fields.issueType === "bank_details_change") return !!fields.bankDetails;
      if (fields.issueType === "soa_request") return !!fields.dateRangeStart && !!fields.dateRangeEnd;
      if (fields.issueType === "proof_of_transfer") return !!fields.orderOrInvoiceId && !!fields.dateRangeStart && !!fields.dateRangeEnd;
      if (fields.issueType === "payment_timeline") return true;
      return !!fields.orderOrInvoiceId;
    }
    case "discounts":
      return !!fields.reason && !!fields.discountPercent;
    case "tech":
      return !!fields.issueDescription;
    case "menu":
      return !!fields.items?.length && fields.items.every((i) => i.itemName);
    case "other":
      return !!fields.freeText;
  }
}

export function PortalWizard({ vendor }: { vendor: VendorSummary }) {
  const { t } = useLocale();
  const router = useRouter();
  const [tab, setTab] = useState<"new" | "tickets">("new");
  const [step, setStep] = useState<Step>(vendor.branches.length > 1 ? "branch" : "category");
  const [branch, setBranch] = useState(vendor.branches.length === 1 ? vendor.branches[0] : "");
  const [category, setCategory] = useState<Category | null>(null);
  const [fields, setFields] = useState<TicketFields>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ code: string; autoApplied: boolean } | null>(null);

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

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  async function submit() {
    if (!category) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch, category, fields }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(t("error.submit.generic"));
        return;
      }
      setResult({ code: data.ticket.code, autoApplied: data.autoApplied });
      setStep("done");
    } catch {
      setSubmitError(t("error.network"));
    } finally {
      setSubmitting(false);
    }
  }

  const stepOrder: Step[] = vendor.branches.length > 1 ? ["branch", "category", "form", "done"] : ["category", "form", "done"];
  const stepLabelKey: Record<Step, "wizard.step.branch" | "wizard.step.category" | "wizard.step.form" | "wizard.step.done"> = {
    branch: "wizard.step.branch",
    category: "wizard.step.category",
    form: "wizard.step.form",
    done: "wizard.step.done",
  };
  const currentIndex = stepOrder.indexOf(step);
  const railSteps = stepOrder.map((s, i) => ({
    label: t(stepLabelKey[s]),
    state: i < currentIndex ? "done" as const : i === currentIndex ? "current" as const : "upcoming" as const,
  }));

  return (
    <div className="flex min-h-dvh">
      <BrandRail
        eyebrow={vendor.accountManagerName}
        title={vendor.name}
        subtitle={tab === "tickets" ? t("wizard.subtitle.tickets") : t("wizard.subtitle.new")}
      >
        {tab === "new" && <RailSteps steps={railSteps} />}
      </BrandRail>

      <div className={`flex flex-1 flex-col px-5 py-8 lg:px-16 lg:py-12 ${tab === "new" ? "lg:justify-center" : ""}`}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 lg:max-w-4xl">
      <header className="flex flex-col gap-3 lg:hidden">
        <div className="flex items-center justify-between">
          <Logo />
          <LocaleToggle />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{vendor.name}</p>
            <p className="text-xs text-ink-soft">{vendor.accountManagerName}</p>
          </div>
          <button onClick={logout} className="text-xs font-semibold text-ink-soft hover:text-brand">
            {t("rail.logout")}
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3">
        <nav className="flex flex-1 gap-1 rounded-xl bg-brand-soft/40 p-1 lg:max-w-sm">
          {(["new", "tickets"] as const).map((tb) => (
            <button
              key={tb}
              onClick={() => (tb === "new" ? startNew() : setTab(tb))}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                tab === tb ? "bg-white text-brand-dark shadow-sm" : "text-ink-soft"
              }`}
            >
              {tb === "new" ? t("wizard.tab.new") : t("wizard.tab.tickets")}
            </button>
          ))}
        </nav>
        <button onClick={logout} className="hidden text-xs font-semibold text-ink-soft hover:text-brand lg:inline">
          {t("rail.logout")}
        </button>
      </div>

      {tab === "tickets" ? (
        <StatusView accountManagerName={vendor.accountManagerName} />
      ) : (
        <>
          {step === "branch" && (
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold">{t("branch.heading")}</h2>
              <div className="mt-4 grid gap-2">
                {vendor.branches.map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      setBranch(b);
                      setStep("category");
                    }}
                    className="rounded-xl border border-line bg-white px-4 py-3 text-start text-sm font-medium hover:border-brand"
                  >
                    {b}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {step === "category" && (
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold">{t("category.heading")}</h2>
              {branch && <p className="text-xs text-ink-soft">{branch}</p>}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCategory(c);
                      setStep("form");
                    }}
                    className="flex flex-col items-start gap-2.5 rounded-xl border border-line bg-white p-4 text-start hover:border-brand hover:shadow-sm"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
                      <CategoryIcon category={c} className="h-5 w-5" />
                    </span>
                    <span className="font-semibold">{t(`category.${c}.label`)}</span>
                    <span className="text-xs text-ink-soft">{t(`category.${c}.blurb`)}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {step === "form" && category && (
            <Card className="p-6">
              <button onClick={() => setStep("category")} className="mb-3 text-xs font-semibold text-ink-soft hover:text-brand">
                {t("form.back")}
              </button>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
                  <CategoryIcon category={category} className="h-[18px] w-[18px]" />
                </span>
                <h2 className="font-display text-lg font-bold">{t(`category.${category}.label`)}</h2>
              </div>

              <div className="mt-4">
                {category === "finance" && <FinanceForm fields={fields} update={update} />}
                {category === "discounts" && <DiscountsForm fields={fields} update={update} />}
                {category === "tech" && <TechForm fields={fields} update={update} branch={branch} />}
                {category === "menu" && <MenuForm fields={fields} update={update} />}
                {category === "other" && <OtherForm fields={fields} update={update} />}
              </div>

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
                {submitting ? t("form.submitting") : t("form.submit")}
              </Button>
            </Card>
          )}

          {step === "done" && result && (
            <Card className="p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-good-soft text-2xl">✓</div>
              <h2 className="font-display text-lg font-bold">{t("done.heading")}</h2>
              <p className="mt-1 font-mono text-sm text-ink-soft">{result.code}</p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {result.autoApplied && <Pill tone="good">{t("done.autoApplied")}</Pill>}
              </div>

              <p className="mt-4 text-sm text-ink-soft">{t("done.body")}</p>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button variant="secondary" onClick={startNew}>{t("done.another")}</Button>
                <Button onClick={() => setTab("tickets")}>{t("done.track")}</Button>
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
