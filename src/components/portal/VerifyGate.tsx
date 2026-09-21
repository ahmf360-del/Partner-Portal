"use client";

import { useState } from "react";
import { Button, Card, TextInput } from "@/components/ui/primitives";
import { Logo } from "@/components/brand/Logo";
import { BrandRail } from "@/components/brand/BrandRail";

export function VerifyGate({
  token,
  vendorName,
  maskedPhone,
  onVerified,
}: {
  token: string;
  vendorName: string;
  maskedPhone: string;
  onVerified: () => void;
}) {
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "Couldn't send a code");
      setSent(true);
      setDevCode(data.devCode);
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, code }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "That code didn't work");
      try {
        localStorage.setItem(`bf_verified_${token}`, "1");
      } catch {}
      onVerified();
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh">
      <BrandRail
        eyebrow="Welcome back"
        title={`Hi, ${vendorName}`}
        subtitle="One quick check and you're straight into your requests — finance, discounts, tech support, and menu changes, all from this one link."
      />
      <div className="flex flex-1 flex-col justify-center px-5 py-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 lg:max-w-lg">
      <div className="lg:hidden">
        <Logo />
      </div>
      <Card className="p-6">
        <h1 className="font-display text-xl font-bold lg:hidden">Hi, {vendorName} 👋</h1>
        <p className="mt-1 text-sm text-ink-soft lg:mt-0">
          Confirm it&apos;s you before we open your requests. We&apos;ll text a code to{" "}
          <span className="font-medium text-ink">{maskedPhone}</span>.
        </p>

        {!sent ? (
          <Button className="mt-5 w-full" onClick={sendCode} disabled={loading}>
            {loading ? "Sending…" : "Send verification code"}
          </Button>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {devCode && (
              <p className="rounded-lg bg-warn-soft px-3.5 py-2.5 text-xs text-warn">
                Demo mode — no WhatsApp/SMS provider connected yet, so here&apos;s the code: <b>{devCode}</b>
              </p>
            )}
            <TextInput
              inputMode="numeric"
              maxLength={4}
              placeholder="4-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="text-center text-lg tracking-[0.4em]"
            />
            <Button onClick={verify} disabled={loading || code.length < 4}>
              {loading ? "Checking…" : "Verify & continue"}
            </Button>
            <button onClick={sendCode} className="text-xs font-semibold text-ink-soft hover:text-brand">
              Resend code
            </button>
          </div>
        )}

        {error && <p className="mt-3 text-xs font-medium text-critical">{error}</p>}
      </Card>
      </div>
      </div>
    </div>
  );
}
