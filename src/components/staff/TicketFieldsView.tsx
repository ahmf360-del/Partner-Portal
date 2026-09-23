"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import type { Category, MenuLineItem, TicketFields } from "@/lib/types";

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-3 py-1.5 text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className="col-span-2 font-medium">{value}</span>
    </div>
  );
}

function MenuItemCard({ item, index }: { item: MenuLineItem; index: number }) {
  const { t } = useLocale();
  return (
    <div className="rounded-lg border border-line bg-brand-soft/15 p-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        {t("menu.item", { n: index + 1 })} — {t(`menu.changeType.${item.changeType}`)}
      </p>
      <Row label={t("menu.itemName")} value={item.itemName} />
      <Row label={t("menu.section")} value={item.menuSection} />
      <Row label={t("menu.currentPrice")} value={item.currentPrice} />
      <Row label={`${t("menu.newPrice")} / ${t("menu.price")}`} value={item.newPrice} />
      <Row label={t("menu.effectiveDate")} value={item.effectiveDate} />
      <Row label={t("menu.description")} value={item.description} />
      <Row label={t("menu.availabilityWindow")} value={item.availabilityWindow} />
      <Row label={t("menu.removalReason")} value={item.removalReason ? t(`menu.removalReason.${item.removalReason}`) : undefined} />
      <Row label={t("team.attachment")} value={item.photoName} />
      <div className="mt-1.5 flex gap-2">
        {item.autoApplied != null && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.autoApplied ? "bg-good-soft text-good" : "bg-warn-soft text-warn"}`}>
            {item.autoApplied ? t("team.item.autoApplied") : t("team.item.needsReview")}
          </span>
        )}
      </div>
    </div>
  );
}

export function TicketFieldsView({ category, fields }: { category: Category; fields: TicketFields }) {
  const { t } = useLocale();

  switch (category) {
    case "finance":
      return (
        <div>
          <Row label={t("finance.issueType")} value={fields.issueType ? t(`finance.issueType.${fields.issueType}`) : undefined} />
          <Row label={t("finance.amount")} value={fields.amount ? `EGP ${fields.amount}` : undefined} />
          <Row label={t("finance.reference")} value={fields.orderOrInvoiceId} />
          <Row label={t("finance.bankDetails")} value={fields.bankDetails} />
          <Row label={t("finance.periodStart")} value={fields.dateRangeStart} />
          <Row label={t("finance.periodEnd")} value={fields.dateRangeEnd} />
          <Row label={t("team.attachment")} value={fields.photoName} />
        </div>
      );
    case "discounts":
      return (
        <div>
          <Row label={t("discounts.percent")} value={fields.discountPercent ? `${fields.discountPercent}%` : undefined} />
          <Row label={t("discounts.startDate")} value={fields.dateRangeStart} />
          <Row label={t("discounts.endDate")} value={fields.dateRangeEnd} />
          <Row label={t("discounts.reason")} value={fields.reason} />
        </div>
      );
    case "tech":
      return (
        <div>
          <Row label={t("tech.deviceOrBranch")} value={fields.deviceOrBranch} />
          <Row label={t("tech.description")} value={fields.issueDescription} />
          <Row label={t("team.attachment")} value={fields.photoName} />
        </div>
      );
    case "menu":
      return (
        <div className="grid gap-2">
          {(fields.items ?? []).map((item, i) => (
            <MenuItemCard key={i} item={item} index={i} />
          ))}
        </div>
      );
    case "other":
      return (
        <div>
          <Row label={t("other.freeText")} value={fields.freeText} />
          <Row label={t("team.attachment")} value={fields.photoName} />
        </div>
      );
  }
}
