"use client";

import { useState } from "react";

export function CopyLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const path = `/p/${token}`;

  async function copy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard API can be unavailable (older browsers, non-HTTPS) — the
      // link is still visible and selectable as a fallback.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center gap-2">
      <a href={path} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand">
        Open
      </a>
      <button
        onClick={copy}
        className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
