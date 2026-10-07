# Breadfast Partner Portal — v1

The vendor-facing app from the workflow design: a small/mid-size restaurant partner signs in with
a username and password, picks which restaurant the request is about, picks a category, fills a
form that adapts to what they picked (which also asks which specific branch of that restaurant
it's for), and gets a ticket ID plus a status page they can return to any time. Bilingual —
English and Arabic (with RTL layout) on the same URL, switchable in-page.

Now covers both sides: the vendor flow (steps 1–2) **and** the internal team queues (step 3) where
Finance, Commercial/Growth, Branches & Delivery, Ops/Tech, Content, and Triage open, view, and
reply to what's routed to them. The AM escalation dashboard and real WhatsApp/SMS delivery are
still follow-up work — see "What's mocked" below.

The account manager is deliberately not the first point of contact: a vendor's request always goes
to the owning team first, and only shows an "Escalate to account manager" option on the tracking
page once it's still open and nobody's replied — not as an upfront bypass on the submission form.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and sign in. Demo accounts (see `src/lib/db.ts`):

| Username  | Password    | Vendor    |
| --------- | ----------- | --------- |
| `elzaeem` | `bread-2026` | El Zaeem  |
| `cafenour`| `bread-2026` | Cafe Nour |

Data lives in a local SQLite file at `data/portal.db`, created and seeded automatically on first
run (gitignored — delete it to reset the demo data).

## Auth model

Username + password, not OTP/SMS/WhatsApp — the account manager creates an account and relays the
credentials directly (`/admin`, below). A signed, httpOnly session cookie (`src/lib/session.ts`,
`SESSION_SECRET` env var) identifies the vendor on every request; passwords are hashed with Node's
built-in `scrypt` (`src/lib/password.ts`) — no plaintext password is ever stored, and a reset
password is shown to the account manager exactly once.

## Bilingual (English / Arabic)

One URL, no `/en` vs `/ar` routes — a toggle (`src/components/i18n/LocaleProvider.tsx`) switches
`dir`/`lang` on `<html>` and swaps every string from `src/lib/i18n/dictionary.ts`. Flexbox's `row`
direction already mirrors the two-column layout under `dir="rtl"`, so the brand panel flips to the
right automatically. Arabic renders in Cairo (loaded alongside Inter/Poppins in `layout.tsx`); the
preference is remembered per browser (falls back to the browser's own language on first visit).
Covers the vendor flow (login, wizard, every category form, status tracking) and the `/team` staff
queue (login, ticket list, ticket detail, reply) — the same toggle, same dictionary, same BrandRail
layout on both. `/admin` (vendor-account management) is the one page that stays English-only, since
it's a lower-traffic tool for whoever manages accounts, not something teams use all day.

## Vendor accounts (`/admin`)

Password-gated internal page listing every vendor with a "Reset password" button — this is how an
account manager hands out or resets access, since there's no self-serve signup. Gated by a single
shared password (not real multi-admin auth): set `ADMIN_PASSWORD` in your environment before
deploying anywhere real; locally it falls back to `breadfast-demo` (see `src/lib/adminAuth.ts`).

## Team queues (`/team`)

Where the five owning teams actually work tickets — separate from `/admin`, which only manages
vendor access. One shared login for every department (demo account, `src/lib/db.ts`):

| Username | Password      |
| -------- | ------------- |
| `staff`  | `staff-2026`  |

After signing in, a full-height dark-purple sidebar (`bg-brand-dark`, the same darker shade used
elsewhere for hover/active states) lists all six departments — labeled with the exact same names
vendors see when filing a request (Finance, Discounts & Offers, Branches & Delivery, Tech Support,
Menu & Content, Other), not an internal team name — clicking one loads that team's queue (`listTicketsForTeam`,
scoped by the ticket's own `owning_team`, not by who's logged in; `OWNING_TEAM` in
`src/lib/config.ts` maps each vendor-facing category to the internal team string used for
routing/filtering). On mobile the sidebar collapses to a horizontal scrollable row instead of
taking the full width. The queue lists every ticket for the selected team (filterable: Open / Escalated / Resolved / All,
sorted escalated-first then by SLA urgency), a click opens the full ticket — vendor, restaurant,
branch, every field submitted, and the reply thread. Staff can send a reply (the vendor sees it on
their own status page the next time they open it, attributed to the ticket's owning team, e.g.
"Finance Team"), mark a ticket resolved with or without a reply, and an untouched ticket
automatically moves from "received" to "in progress" on the first reply. Bilingual and using the
same BrandRail split-screen layout as the vendor side — same design system, same EN/AR toggle.

## Restaurant + branch

Every ticket is filed against a restaurant (the upfront picker, `vendor.restaurants` —
`src/lib/db.ts`). The specific branch/chain location is only asked inside Tech Support's form
(a tablet or printer issue lives at one physical branch) — every other category only needs the
restaurant. A vendor with just one restaurant skips straight to the category picker, same as the
old single-branch case.

## Category fields

Every category also has an optional attachment field.

- **Finance**: payout delay, payment timeline, changing bank details (new bank details go to a
  required text field, applied only after finance verifies), proof of transfer, statement of
  account (SOA).
- **Discounts & offers**: request type (new offers, update offer), price before/after, discount %,
  start/end date, offer details (what the offer is and why), whether it's exclusive to Breadfast —
  auto-approved at or under the threshold in `src/lib/config.ts`, otherwise reviewed by Commercial/Growth.
- **Branches & Delivery**: request type (new branch, update branch, change delivery times, other),
  details.
- **Tech support**: issue with the Talabat device (issue with tablet device, replace tablet,
  connection issue, printer issue), the chain/branch it's at, description.
- **Menu & Content**: item price change, remove item permanently, add a new item, full menu price
  change, update description/photo, or a general menu update — per line item, multiple items per
  ticket. Full menu price change, update description/photo, and menu update all prompt to attach a
  file (new price list, or the new photo).

## What's real

- Full vendor flow: sign in → restaurant → category → dynamic form → submit → ticket ID → track/reopen/rate.
  Switching to "My tickets" mid-form and back to "New request" returns to that same in-progress
  step rather than restarting the restaurant/category chain — only an actual submission (or the
  explicit "Submit another" button) starts a fresh request.
- Menu & Content supports multiple line items per ticket, each independently routed by risk
  (`src/lib/tickets.ts` → `resolveMenuItem`), matching the design doc's Fig. 3.
- Auto-apply vs. human-review logic, SLA due dates, owning-team assignment, and the escalation
  flags (vendor escalated a stalled ticket, reopened more than once) all run for real against
  SQLite.
- Ticket ownership is checked server-side against the session on every read/reopen/rate — a vendor
  can't view or act on another vendor's tickets by guessing an ID, and the same holds per-team on
  the staff side.
- Team queues + replies: staff see their team's tickets in full, reply (vendor sees it), and
  resolve — `src/lib/tickets.ts` → `listTicketsForTeam`, `replyToTicket`.
- Every network call shows a real error message on failure instead of failing silently.

## Brand identity

Real, not a placeholder: `public/brand/logo-mark.png` is the mark the user supplied, rendered
untouched (no recolor/redraw/resize distortion — `src/components/brand/Logo.tsx`). The magenta in
`src/app/globals.css` (`--bf-magenta: #aa0082`) was sampled directly from that image's pixels, not
estimated. If a vector version or an official style guide (typography, clear-space, do's/don'ts)
becomes available later, swap the PNG for the SVG in that same file — nothing else needs to change.

## What's mocked (see `src/lib/config.ts` and inline comments)

- **WhatsApp notifications** — the confirmation screen says a message is coming, but nothing is
  actually sent yet.
- **File uploads** — photo/screenshot inputs capture a filename only; no storage backend is connected.
- **Discount % and price-change % auto-apply thresholds** (`src/lib/config.ts`) — placeholder
  numbers pending the business decision flagged in the workflow design doc.
- **AM escalation dashboard, SLA-breach alerting job** — not built yet; escalation *flags* on a
  ticket are real (see "What's real"), there's just no dedicated AM-facing view for them yet.

## Structure

```
src/lib/         DB (better-sqlite3), ticket/SLA/routing logic, session, passwords, formatting
src/lib/staff.ts     Staff auth (separate table/session from vendors)
src/lib/i18n/    Translation dictionary (English + Arabic)
src/app/api/     Route handlers: auth/*, staff/*, tickets/*, admin/*
src/app/page.tsx     Vendor: session-aware login form or the wizard
src/app/team/page.tsx  Staff: session-aware login form or the queue
src/components/portal/  Vendor wizard, per-category forms, status/tracking view
src/components/staff/   Staff queue (list + ticket detail + reply), read-only field renderer
src/components/i18n/    Locale context, hook, and EN/AR toggle (vendor + staff sides)
src/components/brand/   Logo (renders public/brand/logo-mark.png), the two-column BrandRail layout
```
