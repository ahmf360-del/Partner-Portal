"use client";

import { useState } from "react";
import { Button, Card, TextInput } from "@/components/ui/primitives";
import { Logo } from "@/components/brand/Logo";
import { BrandRail } from "@/components/brand/BrandRail";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) return setError("Wrong password");
    window.location.reload();
  }

  return (
    <div className="flex min-h-dvh">
      <BrandRail
        eyebrow="Internal tool"
        title="Link directory"
        subtitle="Every vendor's persistent link, ready to copy and send — vendors never see this page."
      />
      <div className="flex flex-1 flex-col justify-center px-5 py-10">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div className="lg:hidden">
        <Logo />
      </div>
      <Card className="p-6">
        <h1 className="font-display text-lg font-bold lg:hidden">Link directory</h1>
        <p className="mt-1 text-sm text-ink-soft lg:mt-0">Account managers only — enter the shared password.</p>
        <form
          className="mt-5 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <TextInput
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <Button type="submit" disabled={loading || !password}>
            {loading ? "Checking…" : "Enter"}
          </Button>
        </form>
        {error && <p className="mt-3 text-xs font-medium text-critical">{error}</p>}
      </Card>
      </div>
      </div>
    </div>
  );
}
