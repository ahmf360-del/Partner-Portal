import { dictionary } from "@/lib/i18n/dictionary";
import type { Category, MenuLineItem, TicketFields } from "@/lib/types";

// Staff tool stays English-only by design (see README) — pulling straight
// from the English half of the bilingual dictionary keeps labels consistent
// with the vendor-facing forms without needing the locale hook here.
const en = dictionary.en;

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
  return (
    <div className="rounded-lg border border-line bg-brand-soft/15 p-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        {en["menu.item"].replace("{n}", String(index + 1))} — {en[`menu.changeType.${item.changeType}`]}
      </p>
      <Row label={en["menu.itemName"]} value={item.itemName} />
      <Row label={en["menu.section"]} value={item.menuSection} />
      <Row label={en["menu.currentPrice"]} value={item.currentPrice} />
      <Row label={en["menu.newPrice"] + " / " + en["menu.price"]} value={item.newPrice} />
      <Row label={en["menu.effectiveDate"]} value={item.effectiveDate} />
      <Row label={en["menu.description"]} value={item.description} />
      <Row label={en["menu.availabilityWindow"]} value={item.availabilityWindow} />
      <Row label={en["menu.removalReason"]} value={item.removalReason ? en[`menu.removalReason.${item.removalReason}`] : undefined} />
      <Row label={en["menu.expectedReturnDate"]} value={item.expectedReturnDate} />
      <Row label="Notes" value={item.reorderNotes} />
      <Row label={en["field.photo.attached"].replace(": {name}", "").replace("{name}", "")} value={item.photoName} />
      <div className="mt-1.5 flex gap-2">
        {item.autoApplied != null && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.autoApplied ? "bg-good-soft text-good" : "bg-warn-soft text-warn"}`}>
            {item.autoApplied ? "Auto-applied" : "Needs review"}
          </span>
        )}
      </div>
    </div>
  );
}

export function TicketFieldsView({ category, fields }: { category: Category; fields: TicketFields }) {
  switch (category) {
    case "finance":
      return (
        <div>
          <Row label={en["finance.issueType"]} value={fields.issueType ? en[`finance.issueType.${fields.issueType}`] : undefined} />
          <Row label={en["finance.reportType"]} value={fields.reportType ? en[`finance.reportType.${fields.reportType}`] : undefined} />
          <Row label={en["finance.amount"]} value={fields.amount ? `EGP ${fields.amount}` : undefined} />
          <Row label={en["finance.reference"]} value={fields.orderOrInvoiceId} />
          <Row label={en["finance.periodStart"]} value={fields.dateRangeStart} />
          <Row label={en["finance.periodEnd"]} value={fields.dateRangeEnd} />
          <Row label="Attachment" value={fields.photoName} />
        </div>
      );
    case "discounts":
      return (
        <div>
          <Row label={en["discounts.campaignType"]} value={fields.campaignType ? en[`discounts.campaignType.${fields.campaignType}`] : undefined} />
          <Row label={en["discounts.percent"]} value={fields.discountPercent ? `${fields.discountPercent}%` : undefined} />
          <Row label={en["discounts.startDate"]} value={fields.dateRangeStart} />
          <Row label={en["discounts.endDate"]} value={fields.dateRangeEnd} />
          <Row label={en["discounts.reason"]} value={fields.reason} />
        </div>
      );
    case "tech":
      return (
        <div>
          <Row label={en["tech.deviceOrBranch"]} value={fields.deviceOrBranch} />
          <Row label={en["tech.urgency"]} value={fields.urgency ? en[`tech.urgency.${fields.urgency}`] : undefined} />
          <Row label={en["tech.description"]} value={fields.issueDescription} />
          <Row label="Attachment" value={fields.photoName} />
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
          <Row label={en["other.freeText"]} value={fields.freeText} />
          <Row label="Attachment" value={fields.photoName} />
        </div>
      );
  }
}
