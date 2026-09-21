# Breadfast Partner Portal — v1

The vendor-facing app from the workflow design: a small/mid-size restaurant partner signs in with
a username and password, picks a branch and a category, fills a form that adapts to what they
picked, and gets a ticket ID plus a status page they can return to any time. Bilingual — English
and Arabic (with RTL layout) on the same URL, switchable in-page.

Now covers both sides: the vendor flow (steps 1–2) **and** the internal team queues (step 3) where
Finance, Commercial/Growth, Ops/Tech, Content, and Triage open, view, and reply to what's routed to
them. The AM escalation dashboard and real WhatsApp/SMS delivery are still follow-up work — see
"What's mocked" below.

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
vendor access. Each department signs in with its own username/password (its own session, so a
vendor and a staff member can be logged in on the same browser without clashing) and sees only its
own queue (`owning_team` on the ticket, scoped server-side — a Content account can't fetch a
Finance ticket by guessing an id). Demo accounts (`src/lib/db.ts`, pattern `<username>-2026`):

| Username  | Password        | Team                  |
| --------- | --------------- | ---------------------- |
| `finance` | `finance-2026`  | Finance queue           |
| `growth`  | `growth-2026`   | Commercial / Growth     |
| `ops`     | `ops-2026`      | Ops / Tech support      |
| `content` | `content-2026`  | Content queue           |
| `triage`  | `triage-2026`   | Triage                  |

The queue lists every ticket for that team (filterable: Open / Escalated / Resolved / All, sorted
escalated-first then by SLA urgency), a click opens the full ticket — vendor, branch, every field
submitted, and the reply thread. Staff can send a reply (the vendor sees it on their own status
page the next time they open it), mark a ticket resolved with or without a reply, and an untouched
ticket automatically moves from "received" to "in progress" on the first reply. Bilingual and using
the same BrandRail split-screen layout as the vendor side — same design system, same EN/AR toggle.

## What's real

- Full vendor flow: sign in → branch → category → dynamic form → submit → ticket ID → track/reopen/rate.
- Menu & Content supports multiple line items per ticket, each independently routed by risk
  (`src/lib/tickets.ts` → `resolveMenuItem`), matching the design doc's Fig. 3.
- Auto-apply vs. human-review logic, SLA due dates, owning-team assignment, and the escalation
  flags (vendor asked for the AM, commercial terms, reopened more than once) all run for real
  against SQLite.
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
