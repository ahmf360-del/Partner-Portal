"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, TextInput } from "@/components/ui/primitives";
import { Logo } from "@/components/brand/Logo";
import { BrandRail } from "@/components/brand/BrandRail";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function StaffLogin() {
  const { t } = useLocale();
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
        setError(t("login.error.invalid"));
        return;
      }
      router.refresh();
    } catch {
      setError(t("login.error.network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh">
      <BrandRail eyebrow={t("team.rail.eyebrow")} title={t("team.rail.title")} subtitle={t("team.rail.subtitle")} />
      <div className="flex flex-1 flex-col justify-center px-5 py-10 lg:px-16">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Card className="p-6">
            <h1 className="font-display text-xl font-bold">{t("team.login.heading")}</h1>
            <p className="mt-1 text-sm text-ink-soft">{t("team.login.subheading")}</p>

            <form
              className="mt-5 flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <Field label={t("login.username")}>
                <TextInput autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </Field>
              <Field label={t("login.password")}>
                <TextInput type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </Field>
              <Button type="submit" disabled={loading || !username || !password}>
                {loading ? t("login.submitting") : t("login.submit")}
              </Button>
            </form>

            {error && <p className="mt-3 text-xs font-medium text-critical">{error}</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
