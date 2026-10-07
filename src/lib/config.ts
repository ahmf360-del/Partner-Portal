// Business thresholds the workflow design flagged as "open decisions before build".
// Placeholder defaults so the flow is demonstrable end-to-end — swap these for the
// real numbers once Commercial/Growth and the content team confirm them.
export const THRESHOLDS = {
  /** Discount % at or below this auto-approves; above it routes to Commercial/Growth. */
  discountAutoApprovePct: 15,
  /** Price move % at or below this auto-applies; above it routes to the content team. */
  priceChangeAutoApplyPct: 10,
};

export const SLA_HOURS = {
  finance: 48,
  discounts: 24,
  branches: 48,
  tech: 4,
  other: 24,
  menu: {
    price_change_auto: 4,
    price_change_review: 12,
    remove_permanent: 24,
    add_item: 48,
    update_content: 24,
    full_menu_price_change: 48,
    menu_update: 24,
  },
} as const;

export const OWNING_TEAM = {
  finance: "Finance queue",
  discounts: "Commercial / Growth",
  branches: "Branches & Delivery",
  tech: "Ops / Tech support",
  menu: "Content queue",
  other: "Triage",
} as const;

// Staff share one login across every department (src/components/staff/StaffQueue.tsx),
// so a reply's author is attributed by the ticket's owning team, not an
// individual staff identity.
export const TEAM_AUTHOR_NAME: Record<string, string> = {
  [OWNING_TEAM.finance]: "Finance Team",
  [OWNING_TEAM.discounts]: "Commercial / Growth Team",
  [OWNING_TEAM.branches]: "Branches & Delivery Team",
  [OWNING_TEAM.tech]: "Ops / Tech Support Team",
  [OWNING_TEAM.menu]: "Content Team",
  [OWNING_TEAM.other]: "Triage Team",
};
