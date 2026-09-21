# Breadfast Partner Portal — v1

The vendor-facing app from the workflow design: a small/mid-size restaurant partner signs in with
a username and password, picks a branch and a category, fills a form that adapts to what they
picked, and gets a ticket ID plus a status page they can return to any time. Bilingual — English
and Arabic (with RTL layout) on the same URL, switchable in-page.

This is the **vendor side only** (build order steps 1–2). The internal team queues, SLA-breach
escalation dashboard, and real WhatsApp/SMS delivery are follow-up work — see "What's mocked" below.

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
Covers the full vendor flow (login, wizard, every category form, status tracking) — the internal
`/admin` tool stays English-only, since it's for the account manager, not vendors.

## Vendor accounts (`/admin`)

Password-gated internal page listing every vendor with a "Reset password" button — this is how an
account manager hands out or resets access, since there's no self-serve signup. Gated by a single
shared password (not real multi-admin auth): set `ADMIN_PASSWORD` in your environment before
deploying anywhere real; locally it falls back to `breadfast-demo` (see `src/lib/adminAuth.ts`).

## What's real

- Full vendor flow: sign in → branch → category → dynamic form → submit → ticket ID → track/reopen/rate.
- Menu & Content supports multiple line items per ticket, each independently routed by risk
  (`src/lib/tickets.ts` → `resolveMenuItem`), matching the design doc's Fig. 3.
- Auto-apply vs. human-review logic, SLA due dates, owning-team assignment, and the escalation
  flags (vendor asked for the AM, commercial terms, reopened more than once) all run for real
  against SQLite.
- Ticket ownership is checked server-side against the session on every read/reopen/rate — a vendor
  can't view or act on another vendor's tickets by guessing an ID.
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
- **Internal queue views, AM dashboard, SLA-breach escalation job** — not built yet; this repo only
  covers what the vendor sees.

## Structure

```
src/lib/         DB (better-sqlite3), ticket/SLA/routing logic, session, passwords, formatting
src/lib/i18n/    Translation dictionary (English + Arabic)
src/app/api/     Route handlers: auth/login|logout, tickets, tickets/[id]/reopen|rate, admin/*
src/app/page.tsx  Session-aware: login form or the wizard
src/components/portal/  Wizard, per-category forms, status/tracking view
src/components/i18n/    Locale context, hook, and EN/AR toggle
src/components/brand/   Logo (renders public/brand/logo-mark.png), the two-column BrandRail layout
```
