# Breadfast Partner Portal — v1

The vendor-facing link from the workflow design: a small/mid-size restaurant partner opens their
persistent link, verifies once, picks a branch and a category, fills a form that adapts to what
they picked, and gets a ticket ID plus a status page they can return to any time.

This is the **vendor side only** (build order steps 1–2). The internal team queues, SLA-breach
escalation dashboard, and real WhatsApp/SMS delivery are follow-up work — see "What's mocked" below.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000` — it lists demo vendor links (`/p/el-zaeem`, `/p/cafe-nour`). In
production each vendor gets one persistent link sent once via WhatsApp; there's no separate login.

Data lives in a local SQLite file at `data/portal.db`, created and seeded automatically on first
run (gitignored — delete it to reset the demo data).

## What's real

- Full vendor flow: verify → branch → category → dynamic form → submit → ticket ID → track/reopen/rate.
- Menu & Content supports multiple line items per ticket, each independently routed by risk
  (`src/lib/tickets.ts` → `resolveMenuItem`), matching the design doc's Fig. 3.
- Auto-apply vs. human-review logic, SLA due dates, owning-team assignment, and the escalation
  flags (vendor asked for the AM, commercial terms, reopened more than once) all run for real
  against SQLite.

## Brand identity

Real, not a placeholder: `public/brand/logo-mark.png` is the mark the user supplied, rendered
untouched (no recolor/redraw/resize distortion — `src/components/brand/Logo.tsx`). The magenta in
`src/app/globals.css` (`--bf-magenta: #aa0082`) was sampled directly from that image's pixels, not
estimated. If a vector version or an official style guide (typography, clear-space, do's/don'ts)
becomes available later, swap the PNG for the SVG in that same file — nothing else needs to change.

## What's mocked (see `src/lib/config.ts` and inline comments)

- **OTP / verification** (`src/lib/otp.ts`) — no WhatsApp Business API or SMS provider is wired up,
  so the code is shown directly on screen instead of texted.
- **WhatsApp notifications** — the confirmation screen says a message is coming, but nothing is
  actually sent yet.
- **File uploads** — photo/screenshot inputs capture a filename only; no storage backend is connected.
- **Discount % and price-change % auto-apply thresholds** (`src/lib/config.ts`) — placeholder
  numbers pending the business decision flagged in the workflow design doc.
- **Internal queue views, AM dashboard, SLA-breach escalation job** — not built yet; this repo only
  covers what the vendor sees.

## Structure

```
src/lib/         DB (better-sqlite3), ticket/SLA/routing logic, OTP mock, formatting
src/app/api/     Route handlers: otp/request, otp/verify, tickets, tickets/[id]/reopen|rate
src/app/p/[token]/  The vendor's persistent link
src/components/portal/  Wizard, per-category forms, status/tracking view
src/components/brand/   Logo (renders public/brand/logo-mark.png)
```
