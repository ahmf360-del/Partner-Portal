import { db } from "./db";
import { verifyPassword } from "./password";
import type { Staff } from "./types";

interface StaffRow {
  id: number;
  username: string;
  password_hash: string;
  name: string;
  team: string;
}

function staffFromRow(row: StaffRow): Staff {
  return { id: row.id, username: row.username, name: row.name, team: row.team };
}

export function getStaffById(id: number): Staff | null {
  const row = db.prepare("SELECT * FROM staff WHERE id = ?").get(id) as StaffRow | undefined;
  return row ? staffFromRow(row) : null;
}

export function verifyStaffLogin(username: string, password: string): Staff | null {
  const row = db
    .prepare("SELECT * FROM staff WHERE username = ?")
    .get(username.trim().toLowerCase()) as StaffRow | undefined;
  if (!row || !verifyPassword(password, row.password_hash)) return null;
  return staffFromRow(row);
}
