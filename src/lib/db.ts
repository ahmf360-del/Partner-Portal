import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const globalForDb = globalThis as unknown as { bfDb?: Database.Database };

export const db =
  globalForDb.bfDb ?? new Database(path.join(dataDir, "portal.db"));
globalForDb.bfDb = db;

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
  const count = db.prepare("SELECT COUNT(*) as n FROM vendors").get() as { n: number };
  if (count.n > 0) return;

  const insert = db.prepare(`
    INSERT INTO vendors (token, name, phone, branches, portfolio_tier, account_manager_name)
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
