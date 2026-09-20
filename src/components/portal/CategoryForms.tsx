"use client";

import { THRESHOLDS } from "@/lib/config";
import { MENU_CHANGE_LABEL } from "@/lib/types";
import type { MenuChangeType, MenuLineItem, TicketFields } from "@/lib/types";
import { Button, Field, Select, TextArea, TextInput } from "@/components/ui/primitives";

interface FormProps {
  fields: TicketFields;
  update: (patch: Partial<TicketFields>) => void;
}

function PhotoField({ value, onChange, label = "Photo" }: { value?: string; onChange: (name?: string) => void; label?: string }) {
  return (
    <Field label={label} hint="Demo build: only the filename is captured — real upload storage isn't wired up yet.">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0]?.name)}
        className="w-full rounded-lg border border-dashed border-line bg-white px-3.5 py-2.5 text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-brand-dark file:font-semibold"
      />
      {value && <span className="text-xs text-good">Attached: {value}</span>}
    </Field>
  );
}

export function FinanceForm({ fields, update }: FormProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Issue type" required>
        <Select
          value={fields.issueType ?? ""}
          onChange={(e) => update({ issueType: e.target.value as TicketFields["issueType"] })}
          required
        >
          <option value="" disabled>Select one</option>
          <option value="payout_delay">Payout delay</option>
          <option value="invoice_dispute">Invoice dispute</option>
          <option value="commission_question">Commission question</option>
        </Select>
      </Field>
      <Field label="Amount (EGP)">
        <TextInput type="number" min={0} value={fields.amount ?? ""} onChange={(e) => update({ amount: e.target.value })} placeholder="0.00" />
      </Field>
      <Field label="Order or invoice ID" required>
        <TextInput value={fields.orderOrInvoiceId ?? ""} onChange={(e) => update({ orderOrInvoiceId: e.target.value })} placeholder="e.g. INV-88213" required />
      </Field>
      <div className="sm:col-span-2">
        <PhotoField value={fields.photoName} onChange={(photoName) => update({ photoName })} label="Screenshot" />
      </div>
    </div>
  );
}

export function DiscountsForm({ fields, update }: FormProps) {
  const isCommercial = fields.campaignType === "commercial_terms";
  const pct = parseFloat(fields.discountPercent ?? "");
  const willAutoApprove = !isCommercial && Number.isFinite(pct) && pct <= THRESHOLDS.discountAutoApprovePct;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Campaign type" required>
        <Select
          value={fields.campaignType ?? ""}
          onChange={(e) => update({ campaignType: e.target.value as TicketFields["campaignType"] })}
          required
        >
          <option value="" disabled>Select one</option>
          <option value="weekend_offer">Weekend offer</option>
          <option value="seasonal_promo">Seasonal promo</option>
          <option value="flash_sale">Flash sale</option>
          <option value="commercial_terms">Rate / contract / exclusivity change</option>
        </Select>
      </Field>
      {!isCommercial && (
        <Field label="Discount %" required hint={fields.discountPercent ? (willAutoApprove ? `At or under ${THRESHOLDS.discountAutoApprovePct}% — usually auto-approved` : `Over ${THRESHOLDS.discountAutoApprovePct}% — a person will review it`) : undefined}>
          <TextInput type="number" min={0} max={100} value={fields.discountPercent ?? ""} onChange={(e) => update({ discountPercent: e.target.value })} placeholder="20" required />
        </Field>
      )}
      <Field label="Start date">
        <TextInput type="date" value={fields.dateRangeStart ?? ""} onChange={(e) => update({ dateRangeStart: e.target.value })} />
      </Field>
      <Field label="End date">
        <TextInput type="date" value={fields.dateRangeEnd ?? ""} onChange={(e) => update({ dateRangeEnd: e.target.value })} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Reason / context" required>
          <TextArea value={fields.reason ?? ""} onChange={(e) => update({ reason: e.target.value })} placeholder="What's the offer for, and why now?" required />
        </Field>
      </div>
      {isCommercial && (
        <p className="sm:col-span-2 rounded-lg bg-warn-soft px-3.5 py-2.5 text-xs text-warn">
          Rate, contract, and exclusivity changes always go to your account manager — this never auto-resolves.
        </p>
      )}
    </div>
  );
}

export function TechForm({ fields, update, branch }: FormProps & { branch: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Device / branch" required>
        <TextInput value={fields.deviceOrBranch ?? branch} onChange={(e) => update({ deviceOrBranch: e.target.value })} required />
      </Field>
      <Field label="Urgency" required>
        <Select value={fields.urgency ?? ""} onChange={(e) => update({ urgency: e.target.value as TicketFields["urgency"] })} required>
          <option value="" disabled>Select one</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High — can&apos;t take orders</option>
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="What's happening?" required>
          <TextArea value={fields.issueDescription ?? ""} onChange={(e) => update({ issueDescription: e.target.value })} placeholder="e.g. Tablet stopped receiving orders since 2pm" required />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <PhotoField value={fields.photoName} onChange={(photoName) => update({ photoName })} />
      </div>
    </div>
  );
}

export function OtherForm({ fields, update }: FormProps) {
  return (
    <div className="grid gap-4">
      <Field label="Tell us what you need" required>
        <TextArea rows={4} value={fields.freeText ?? ""} onChange={(e) => update({ freeText: e.target.value })} placeholder="Describe your request" required />
      </Field>
      <PhotoField value={fields.photoName} onChange={(photoName) => update({ photoName })} label="Attachment (optional)" />
    </div>
  );
}

const emptyItem: MenuLineItem = { changeType: "price_change", itemName: "" };

function MenuItemFields({ item, onChange }: { item: MenuLineItem; onChange: (patch: Partial<MenuLineItem>) => void }) {
  switch (item.changeType) {
    case "price_change":
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          <TextInput placeholder="Current price" type="number" value={item.currentPrice ?? ""} onChange={(e) => onChange({ currentPrice: e.target.value })} />
          <TextInput placeholder="New price" type="number" value={item.newPrice ?? ""} onChange={(e) => onChange({ newPrice: e.target.value })} required />
          <TextInput placeholder="Effective date" type="date" value={item.effectiveDate ?? ""} onChange={(e) => onChange({ effectiveDate: e.target.value })} />
        </div>
      );
    case "add_item":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput placeholder="Menu section" value={item.menuSection ?? ""} onChange={(e) => onChange({ menuSection: e.target.value })} />
          <TextInput placeholder="Price" type="number" value={item.newPrice ?? ""} onChange={(e) => onChange({ newPrice: e.target.value })} required />
          <TextArea placeholder="Description" value={item.description ?? ""} onChange={(e) => onChange({ description: e.target.value })} className="sm:col-span-2" />
          <TextInput placeholder="Availability (days / hours)" value={item.availabilityWindow ?? ""} onChange={(e) => onChange({ availabilityWindow: e.target.value })} className="sm:col-span-2" />
          <div className="sm:col-span-2">
            <PhotoField value={item.photoName} onChange={(photoName) => onChange({ photoName })} />
          </div>
        </div>
      );
    case "remove_temp":
    case "remove_permanent":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Select value={item.removalReason ?? ""} onChange={(e) => onChange({ removalReason: e.target.value as MenuLineItem["removalReason"] })}>
            <option value="" disabled>Reason</option>
            <option value="out_of_stock">Out of stock</option>
            <option value="discontinued">Discontinued</option>
            <option value="seasonal">Seasonal</option>
          </Select>
          {item.changeType === "remove_temp" && (
            <TextInput placeholder="Expected return date" type="date" value={item.expectedReturnDate ?? ""} onChange={(e) => onChange({ expectedReturnDate: e.target.value })} />
          )}
        </div>
      );
    case "update_content":
      return (
        <div className="grid gap-3">
          <TextArea placeholder="New description" value={item.description ?? ""} onChange={(e) => onChange({ description: e.target.value })} />
          <PhotoField value={item.photoName} onChange={(photoName) => onChange({ photoName })} label="New photo" />
        </div>
      );
    case "availability":
      return (
        <Select value={item.availabilityWindow ?? ""} onChange={(e) => onChange({ availabilityWindow: e.target.value })}>
          <option value="" disabled>Set status</option>
          <option value="out_of_stock">Mark out of stock</option>
          <option value="in_stock">Mark back in stock</option>
        </Select>
      );
    case "reorder":
      return (
        <TextArea placeholder="Describe the change, e.g. move 'Iced Latte' from Drinks to Featured" value={item.reorderNotes ?? ""} onChange={(e) => onChange({ reorderNotes: e.target.value })} />
      );
  }
}

export function MenuForm({ fields, update }: FormProps) {
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
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Item {i + 1}</span>
            {items.length > 1 && (
              <button type="button" onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-xs font-semibold text-critical hover:underline">
                Remove
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select value={item.changeType} onChange={(e) => patchItem(i, { changeType: e.target.value as MenuChangeType })}>
              {(Object.keys(MENU_CHANGE_LABEL) as MenuChangeType[]).map((k) => (
                <option key={k} value={k}>{MENU_CHANGE_LABEL[k]}</option>
              ))}
            </Select>
            <TextInput placeholder="Item name" value={item.itemName} onChange={(e) => patchItem(i, { itemName: e.target.value })} required />
          </div>
          <div className="mt-3">
            <MenuItemFields item={item} onChange={(patch) => patchItem(i, patch)} />
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={() => setItems([...items, { ...emptyItem }])} className="justify-self-start">
        + Add another item
      </Button>
    </div>
  );
}
