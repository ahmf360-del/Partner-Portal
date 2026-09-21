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
  username: string;
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
  messages: TicketMessage[];
}

/** A ticket as staff see it in a queue — with the vendor identified by name. */
export interface TicketWithVendor extends Ticket {
  vendorName: string;
}

export interface Staff {
  id: number;
  username: string;
  name: string;
  team: string;
}

export interface TicketMessage {
  id: number;
  ticketId: number;
  authorType: "staff" | "vendor";
  authorName: string;
  body: string;
  createdAt: string;
}

// Display labels for these live in the i18n dictionary (category.*.label,
// menu.changeType.*) since the portal is bilingual — these arrays just fix
// the enumeration order for the UI.
export const CATEGORIES: Category[] = ["finance", "discounts", "tech", "menu", "other"];

export const MENU_CHANGE_TYPES: MenuChangeType[] = [
  "availability",
  "price_change",
  "remove_temp",
  "remove_permanent",
  "add_item",
  "update_content",
  "reorder",
];
