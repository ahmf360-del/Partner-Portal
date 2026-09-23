"use client";

import { THRESHOLDS } from "@/lib/config";
import { MENU_CHANGE_TYPES } from "@/lib/types";
import type { MenuChangeType, MenuLineItem, TicketFields } from "@/lib/types";
import { Button, Field, Select, TextArea, TextInput } from "@/components/ui/primitives";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface FormProps {
  fields: TicketFields;
  update: (patch: Partial<TicketFields>) => void;
}

function PhotoField({ value, onChange, label, hint }: { value?: string; onChange: (name?: string) => void; label?: string; hint?: string }) {
  const { t } = useLocale();
  return (
    <Field label={label ?? t("field.attachmentOptional")} hint={hint ?? t("field.photo.hint")}>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0]?.name)}
        className="w-full rounded-lg border border-dashed border-line bg-white px-3.5 py-2.5 text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-brand-dark file:font-semibold"
      />
      {value && <span className="text-xs text-good">{t("field.photo.attached", { name: value })}</span>}
    </Field>
  );
}

const FINANCE_NEEDS_REFERENCE = ["payout_delay", "proof_of_transfer"];
const FINANCE_NEEDS_PERIOD = ["proof_of_transfer", "soa_request"];
const FINANCE_ISSUE_TYPES = ["payout_delay", "payment_timeline", "bank_details_change", "proof_of_transfer", "soa_request"] as const;

export function FinanceForm({ fields, update }: FormProps) {
  const { t } = useLocale();
  const needsReference = FINANCE_NEEDS_REFERENCE.includes(fields.issueType ?? "");
  const needsPeriod = FINANCE_NEEDS_PERIOD.includes(fields.issueType ?? "");
  const needsBankDetails = fields.issueType === "bank_details_change";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t("finance.issueType")} required>
        <Select
          value={fields.issueType ?? ""}
          onChange={(e) => update({ issueType: e.target.value as TicketFields["issueType"] })}
          required
        >
          <option value="" disabled>{t("field.selectOne")}</option>
          {FINANCE_ISSUE_TYPES.map((v) => (
            <option key={v} value={v}>{t(`finance.issueType.${v}`)}</option>
          ))}
        </Select>
      </Field>

      {needsBankDetails && (
        <div className="sm:col-span-2">
          <Field label={t("finance.bankDetails")} required hint={t("finance.bankDetails.hint")}>
            <TextArea value={fields.bankDetails ?? ""} onChange={(e) => update({ bankDetails: e.target.value })} placeholder={t("finance.bankDetails.placeholder")} required />
          </Field>
        </div>
      )}

      {needsReference && (
        <>
          <Field label={t("finance.amount")} hint={fields.issueType === "proof_of_transfer" ? t("finance.amount.hint") : undefined}>
            <TextInput type="number" min={0} value={fields.amount ?? ""} onChange={(e) => update({ amount: e.target.value })} placeholder="0.00" />
          </Field>
          <Field label={fields.issueType === "proof_of_transfer" ? t("finance.reference.transfer") : t("finance.reference")} required>
            <TextInput value={fields.orderOrInvoiceId ?? ""} onChange={(e) => update({ orderOrInvoiceId: e.target.value })} placeholder="e.g. INV-88213" required />
          </Field>
        </>
      )}

      {needsPeriod && (
        <>
          <Field label={t("finance.periodStart")} required hint={fields.issueType === "soa_request" ? t("finance.periodStart.hint") : undefined}>
            <TextInput type="date" value={fields.dateRangeStart ?? ""} onChange={(e) => update({ dateRangeStart: e.target.value })} required />
          </Field>
          <Field label={t("finance.periodEnd")} required>
            <TextInput type="date" value={fields.dateRangeEnd ?? ""} onChange={(e) => update({ dateRangeEnd: e.target.value })} required />
          </Field>
        </>
      )}

      <div className="sm:col-span-2">
        <PhotoField
          value={fields.photoName}
          onChange={(photoName) => update({ photoName })}
          label={needsReference ? t("field.screenshot") : t("field.attachmentOptional")}
        />
      </div>
    </div>
  );
}

export function DiscountsForm({ fields, update }: FormProps) {
  const { t } = useLocale();
  const pct = parseFloat(fields.discountPercent ?? "");
  const willAutoApprove = Number.isFinite(pct) && pct <= THRESHOLDS.discountAutoApprovePct;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        label={t("discounts.percent")}
        required
        hint={
          fields.discountPercent
            ? t(willAutoApprove ? "discounts.percent.autoApprove" : "discounts.percent.review", { pct: THRESHOLDS.discountAutoApprovePct })
            : undefined
        }
      >
        <TextInput type="number" min={0} max={100} value={fields.discountPercent ?? ""} onChange={(e) => update({ discountPercent: e.target.value })} placeholder="20" required />
      </Field>
      <Field label={t("discounts.startDate")}>
        <TextInput type="date" value={fields.dateRangeStart ?? ""} onChange={(e) => update({ dateRangeStart: e.target.value })} />
      </Field>
      <Field label={t("discounts.endDate")}>
        <TextInput type="date" value={fields.dateRangeEnd ?? ""} onChange={(e) => update({ dateRangeEnd: e.target.value })} />
      </Field>
      <div className="sm:col-span-2">
        <Field label={t("discounts.reason")} required>
          <TextArea value={fields.reason ?? ""} onChange={(e) => update({ reason: e.target.value })} placeholder={t("discounts.reason.placeholder")} required />
        </Field>
      </div>
    </div>
  );
}

export function TechForm({ fields, update, branch }: FormProps & { branch: string }) {
  const { t } = useLocale();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t("tech.deviceOrBranch")} required>
        <TextInput value={fields.deviceOrBranch ?? branch} onChange={(e) => update({ deviceOrBranch: e.target.value })} required />
      </Field>
      <div className="sm:col-span-2">
        <Field label={t("tech.description")} required>
          <TextArea value={fields.issueDescription ?? ""} onChange={(e) => update({ issueDescription: e.target.value })} placeholder={t("tech.description.placeholder")} required />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <PhotoField value={fields.photoName} onChange={(photoName) => update({ photoName })} />
      </div>
    </div>
  );
}

export function OtherForm({ fields, update }: FormProps) {
  const { t } = useLocale();
  return (
    <div className="grid gap-4">
      <Field label={t("other.freeText")} required>
        <TextArea rows={4} value={fields.freeText ?? ""} onChange={(e) => update({ freeText: e.target.value })} placeholder={t("other.freeText.placeholder")} required />
      </Field>
      <PhotoField value={fields.photoName} onChange={(photoName) => update({ photoName })} label={t("field.attachmentOptional")} />
    </div>
  );
}

const emptyItem: MenuLineItem = { changeType: "price_change", itemName: "" };

function MenuItemFields({ item, onChange }: { item: MenuLineItem; onChange: (patch: Partial<MenuLineItem>) => void }) {
  const { t } = useLocale();
  switch (item.changeType) {
    case "price_change":
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          <TextInput placeholder={t("menu.currentPrice")} type="number" value={item.currentPrice ?? ""} onChange={(e) => onChange({ currentPrice: e.target.value })} />
          <TextInput placeholder={t("menu.newPrice")} type="number" value={item.newPrice ?? ""} onChange={(e) => onChange({ newPrice: e.target.value })} required />
          <TextInput placeholder={t("menu.effectiveDate")} type="date" value={item.effectiveDate ?? ""} onChange={(e) => onChange({ effectiveDate: e.target.value })} />
        </div>
      );
    case "add_item":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput placeholder={t("menu.section")} value={item.menuSection ?? ""} onChange={(e) => onChange({ menuSection: e.target.value })} />
          <TextInput placeholder={t("menu.price")} type="number" value={item.newPrice ?? ""} onChange={(e) => onChange({ newPrice: e.target.value })} required />
          <TextArea placeholder={t("menu.description")} value={item.description ?? ""} onChange={(e) => onChange({ description: e.target.value })} className="sm:col-span-2" />
          <TextInput placeholder={t("menu.availabilityWindow")} value={item.availabilityWindow ?? ""} onChange={(e) => onChange({ availabilityWindow: e.target.value })} className="sm:col-span-2" />
          <div className="sm:col-span-2">
            <PhotoField value={item.photoName} onChange={(photoName) => onChange({ photoName })} />
          </div>
        </div>
      );
    case "remove_permanent":
      return (
        <Select value={item.removalReason ?? ""} onChange={(e) => onChange({ removalReason: e.target.value as MenuLineItem["removalReason"] })}>
          <option value="" disabled>{t("menu.removalReason")}</option>
          <option value="out_of_stock">{t("menu.removalReason.out_of_stock")}</option>
          <option value="discontinued">{t("menu.removalReason.discontinued")}</option>
          <option value="seasonal">{t("menu.removalReason.seasonal")}</option>
        </Select>
      );
    case "update_content":
      return (
        <div className="grid gap-3">
          <TextArea placeholder={t("menu.description")} value={item.description ?? ""} onChange={(e) => onChange({ description: e.target.value })} />
          <PhotoField value={item.photoName} onChange={(photoName) => onChange({ photoName })} label={t("menu.attachFile")} hint={t("menu.attachFile.content.hint")} />
        </div>
      );
    case "full_menu_price_change":
      return (
        <div className="grid gap-3">
          <TextInput placeholder={t("menu.effectiveDate")} type="date" value={item.effectiveDate ?? ""} onChange={(e) => onChange({ effectiveDate: e.target.value })} />
          <TextArea placeholder={t("menu.description")} value={item.description ?? ""} onChange={(e) => onChange({ description: e.target.value })} />
          <PhotoField value={item.photoName} onChange={(photoName) => onChange({ photoName })} label={t("menu.attachFile")} hint={t("menu.attachFile.fullMenu.hint")} />
        </div>
      );
  }
}

export function MenuForm({ fields, update }: FormProps) {
  const { t } = useLocale();
  const items = fields.items?.length ? fields.items : [emptyItem];

  function setItems(next: MenuLineItem[]) {
    update({ items: next });
  }

  function patchItem(index: number, patch: Partial<MenuLineItem>) {
    setItems(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  return (
    <div className="grid gap-4">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-line bg-brand-soft/20 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("menu.item", { n: i + 1 })}</span>
            {items.length > 1 && (
              <button type="button" onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-xs font-semibold text-critical hover:underline">
                {t("menu.remove")}
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select value={item.changeType} onChange={(e) => patchItem(i, { changeType: e.target.value as MenuChangeType })}>
              {MENU_CHANGE_TYPES.map((k) => (
                <option key={k} value={k}>{t(`menu.changeType.${k}`)}</option>
              ))}
            </Select>
            <TextInput placeholder={t("menu.itemName")} value={item.itemName} onChange={(e) => patchItem(i, { itemName: e.target.value })} required />
          </div>
          <div className="mt-3">
            <MenuItemFields item={item} onChange={(patch) => patchItem(i, patch)} />
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={() => setItems([...items, { ...emptyItem }])} className="justify-self-start">
        {t("menu.addAnother")}
      </Button>
    </div>
  );
}
