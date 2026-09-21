import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { hashPassword } from "./password";

// Vercel's serverless functions run on a read-only filesystem except /tmp, and
// /tmp isn't guaranteed to survive between invocations — so on Vercel this is
// demo-quality persistence (data can reset on a cold start), not the real
// production store. Fine for a first clickable version; swap for a hosted DB
// (e.g. Turso/libSQL, Postgres) before this is the actual vendor link.
const dataDir = process.env.VERCEL
  ? "/tmp/breadfast-portal"
  : path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const globalForDb = globalThis as unknown as { bfDb?: Database.Database };

export const db =
  globalForDb.bfDb ?? new Database(path.join(dataDir, "portal.db"));
globalForDb.bfDb = db;

// Next builds/serverless cold starts can open this file from several
// processes at once. busy_timeout covers most lock contention, but the very
// first WAL-mode switch on a brand-new file can still lose that race before
// the timeout is in effect — so retry the initial setup a few times, with a
// short synchronous backoff (better-sqlite3 is sync, so no async sleep here).
function retryOnBusy<T>(fn: () => T, attempts = 5): T {
  for (let i = 0; i < attempts; i++) {
    try {
      return fn();
    } catch (err) {
      const busy = err instanceof Error && /locked|busy/i.test(err.message);
      if (!busy || i === attempts - 1) throw err;
      const until = Date.now() + 50 * (i + 1);
      while (Date.now() < until) {
        /* brief spin-wait; only ever hit at cold start */
      }
    }
  }
  throw new Error("unreachable");
}

db.pragma("busy_timeout = 5000");
retryOnBusy(() => db.pragma("journal_mode = WAL"));

retryOnBusy(() => db.exec(`
  CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    branches TEXT NOT NULL,
    portfolio_tier TEXT NOT NULL DEFAULT 'standard',
    account_manager_name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id),
    branch TEXT NOT NULL,
    category TEXT NOT NULL,
    fields TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'received',
    owning_team TEXT NOT NULL,
    auto_applied INTEGER NOT NULL DEFAULT 0,
    escalated INTEGER NOT NULL DEFAULT 0,
    escalation_reason TEXT,
    reopened_count INTEGER NOT NULL DEFAULT 0,
    rating INTEGER,
    created_at TEXT NOT NULL,
    sla_due_at TEXT NOT NULL,
    resolved_at TEXT
  );
`));

function seedVendors() {
  // INSERT OR IGNORE on the unique username, rather than a count-then-insert
  // check, so two processes seeding at once (concurrent cold starts) can't
  // race each other into a UNIQUE constraint failure.
  const insert = db.prepare(`
    INSERT OR IGNORE INTO vendors (username, password_hash, name, phone, branches, portfolio_tier, account_manager_name)
    VALUES (@username, @passwordHash, @name, @phone, @branches, @portfolioTier, @accountManagerName)
  `);

  insert.run({
    username: "elzaeem",
    passwordHash: hashPassword("bread-2026"),
    name: "El Zaeem",
    phone: "+201001234567",
    branches: JSON.stringify(["Mohandessin", "Dokki"]),
    portfolioTier: "standard",
    accountManagerName: "Nourhan (your account manager)",
  });

  insert.run({
    username: "cafenour",
    passwordHash: hashPassword("bread-2026"),
    name: "Cafe Nour",
    phone: "+201127654321",
    branches: JSON.stringify(["Zamalek"]),
    portfolioTier: "high-value",
    accountManagerName: "Nourhan (your account manager)",
  });
}

retryOnBusy(seedVendors);
