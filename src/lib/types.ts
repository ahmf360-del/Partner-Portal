export type Category = "finance" | "discounts" | "tech" | "menu" | "other";

export type MenuChangeType =
  | "availability"
  | "price_change"
  | "remove_temp"
  | "remove_permanent"
  | "add_item"
  | "update_content"
  | "reorder";

export type TicketStatus = "received" | "in_progress" | "resolved";

export interface Vendor {
  id: number;
  token: string;
  name: string;
  phone: string;
  branches: string[];
  portfolioTier: "standard" | "high-value";
  accountManagerName: string;
}

export interface MenuLineItem {
  changeType: MenuChangeType;
  itemName: string;
  menuSection?: string;
  currentPrice?: string;
  newPrice?: string;
  description?: string;
  photoName?: string;
  effectiveDate?: string;
  availabilityWindow?: string;
  removalReason?: "out_of_stock" | "discontinued" | "seasonal";
  removalIsPermanent?: boolean;
  expectedReturnDate?: string;
  reorderNotes?: string;
  // computed at submit time
  autoApplied?: boolean;
  slaHours?: number;
}

export interface TicketFields {
  // Finance
  issueType?:
    | "payout_delay"
    | "invoice_dispute"
    | "commission_question"
    | "proof_of_transfer"
    | "soa_request"
    | "report_request";
  amount?: string;
  orderOrInvoiceId?: string;
  reportType?: "sales_summary" | "payout_history" | "reconciliation" | "other";
  // Discounts
  campaignType?: "seasonal_promo" | "weekend_offer" | "flash_sale" | "commercial_terms";
  discountPercent?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  reason?: string;
  // Tech
  deviceOrBranch?: string;
  issueDescription?: string;
  urgency?: "low" | "medium" | "high";
  // Menu & content
  items?: MenuLineItem[];
  // Other
  freeText?: string;
  // shared
  photoName?: string;
  talkToAccountManager?: boolean;
}

export interface Ticket {
  id: number;
  code: string;
  vendorId: number;
  branch: string;
  category: Category;
  fields: TicketFields;
  status: TicketStatus;
  owningTeam: string;
  autoApplied: boolean;
  escalated: boolean;
  escalationReason: string | null;
  reopenedCount: number;
  rating: number | null;
  createdAt: string;
  slaDueAt: string;
  resolvedAt: string | null;
}

export const CATEGORY_LABEL: Record<Category, string> = {
  finance: "Finance",
  discounts: "Discounts & Offers",
  tech: "Tech Support",
  menu: "Menu & Content",
  other: "Other",
};

export const CATEGORY_BLURB: Record<Category, string> = {
  finance: "Payouts, invoices, proof of transfer, statements, reports",
  discounts: "Promos, seasonal offers, weekend deals",
  tech: "Tablet, printer, or app issues at your branch",
  menu: "Add, remove, or update items on your menu",
  other: "Anything else — we'll route it for you",
};

export const MENU_CHANGE_LABEL: Record<MenuChangeType, string> = {
  availability: "Availability / stock toggle",
  price_change: "Price change",
  remove_temp: "Remove item — temporary",
  remove_permanent: "Remove item — permanent",
  add_item: "Add new item",
  update_content: "Update description or photo",
  reorder: "Reorder / recategorize menu",
};
