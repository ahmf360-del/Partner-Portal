"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { dictionary, LOCALES } from "@/lib/i18n/dictionary";
import type { Locale, TranslationKey } from "@/lib/i18n/dictionary";

interface LocaleContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function dirFor(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

function applyToDocument(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = dirFor(locale);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    // One-time read of the saved preference (or the browser's language) —
    // there's no external system to subscribe to, so a direct setState on
    // mount is fine.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const saved = localStorage.getItem("bf_locale");
      if (saved === "en" || saved === "ar") {
        setLocaleState(saved);
        applyToDocument(saved);
        return;
      }
    } catch {}
    const guess: Locale = navigator.language?.toLowerCase().startsWith("ar") ? "ar" : "en";
    setLocaleState(guess);
    applyToDocument(guess);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    applyToDocument(l);
    try {
      localStorage.setItem("bf_locale", l);
    } catch {}
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let str: string = dictionary[locale][key] ?? dictionary.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, dir: dirFor(locale), setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function LocaleToggle({ onBrand = false }: { onBrand?: boolean }) {
  const { locale, setLocale } = useLocale();
  return (
    <div className={`inline-flex rounded-full p-0.5 text-xs font-semibold ${onBrand ? "bg-white/15" : "bg-brand-soft"}`}>
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`rounded-full px-2.5 py-1 transition ${
            locale === l
              ? onBrand
                ? "bg-white text-brand-dark"
                : "bg-white text-brand-dark shadow-sm"
              : onBrand
                ? "text-white/70"
                : "text-ink-soft"
          }`}
        >
          {l === "en" ? "EN" : "AR"}
        </button>
      ))}
    </div>
  );
}
