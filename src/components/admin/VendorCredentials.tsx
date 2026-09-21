"use client";

import { useState } from "react";
import { Pill } from "@/components/ui/primitives";

export function VendorCredentials({ vendorId, username }: { vendorId: number; username: string }) {
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function reset() {
    setLoading(true);
    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId }),
    });
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    setNewPassword(data.password);
  }

  async function copy() {
    if (!newPassword) return;
    try {
      await navigator.clipboard.writeText(newPassword);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-xs text-ink-soft">username: {username}</p>
      {newPassword ? (
        <div className="flex items-center gap-2 rounded-lg bg-warn-soft px-3 py-2">
          <span className="font-mono text-xs font-semibold text-warn">{newPassword}</span>
          <button onClick={copy} className="ms-auto text-xs font-semibold text-warn hover:underline">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      ) : (
        <button
          onClick={reset}
          disabled={loading}
          className="self-start rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Generating…" : "Reset password"}
        </button>
      )}
      {newPassword && (
        <Pill tone="warn">Shown once — relay it to the vendor now</Pill>
      )}
    </div>
  );
}
