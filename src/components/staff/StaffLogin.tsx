"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, TextInput } from "@/components/ui/primitives";
import { Logo } from "@/components/brand/Logo";

export function StaffLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError("Incorrect username or password");
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-5 py-10">
      <Logo />
      <Card className="p-6">
        <h1 className="font-display text-xl font-bold">Team queue sign in</h1>
        <p className="mt-1 text-sm text-ink-soft">For internal Breadfast staff — one account per department.</p>

        <form
          className="mt-5 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Field label="Username">
            <TextInput autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </Field>
          <Field label="Password">
            <TextInput type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <Button type="submit" disabled={loading || !username || !password}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        {error && <p className="mt-3 text-xs font-medium text-critical">{error}</p>}
      </Card>
    </div>
  );
}
