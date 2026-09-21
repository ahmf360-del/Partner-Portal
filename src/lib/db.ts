import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

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
// processes at once; without a busy timeout, the loser of that race gets a
// hard SQLITE_BUSY instead of just waiting a moment for the lock.
db.pragma("busy_timeout = 5000");
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
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
`);

function seedVendors() {
  // INSERT OR IGNORE on the unique token, rather than a count-then-insert
  // check, so two processes seeding at once (concurrent cold starts) can't
  // race each other into a UNIQUE constraint failure.
  const insert = db.prepare(`
    INSERT OR IGNORE INTO vendors (token, name, phone, branches, portfolio_tier, account_manager_name)
    VALUES (@token, @name, @phone, @branches, @portfolioTier, @accountManagerName)
  `);

  insert.run({
    token: "el-zaeem",
    name: "El Zaeem",
    phone: "+201001234567",
    branches: JSON.stringify(["Mohandessin", "Dokki"]),
    portfolioTier: "standard",
    accountManagerName: "Nourhan (your account manager)",
  });

  insert.run({
    token: "cafe-nour",
    name: "Cafe Nour",
    phone: "+201127654321",
    branches: JSON.stringify(["Zamalek"]),
    portfolioTier: "high-value",
    accountManagerName: "Nourhan (your account manager)",
  });
}

seedVendors();
