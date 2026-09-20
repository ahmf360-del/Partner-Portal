// MOCK verification store — no WhatsApp Business API / SMS provider is wired up yet
// (see "open decisions before build" §07: is OTP required, and who sends it).
// Codes live in memory only, so they reset on server restart. Good enough to prove
// the vendor-side flow end to end; swap for a real provider + persistent store later.

interface OtpEntry {
  code: string;
  expiresAt: number;
}

const globalForOtp = globalThis as unknown as { bfOtp?: Map<string, OtpEntry> };
const store = globalForOtp.bfOtp ?? new Map<string, OtpEntry>();
globalForOtp.bfOtp = store;

const TTL_MS = 5 * 60 * 1000;

export function requestOtp(token: string): string {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  store.set(token, { code, expiresAt: Date.now() + TTL_MS });
  return code;
}

export function verifyOtp(token: string, code: string): boolean {
  const entry = store.get(token);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(token);
    return false;
  }
  const ok = entry.code === code.trim();
  if (ok) store.delete(token);
  return ok;
}
