import Image from "next/image";
import type { ReactNode } from "react";
import { Logo } from "./Logo";

// The wide-screen left panel used across the vendor flow and admin pages, so
// a desktop browser gets a real layout instead of a narrow card floating in
// a sea of blank page. Hidden below `lg` — phones keep the single-column
// layout that was already here.
export function BrandRail({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative hidden w-[380px] shrink-0 flex-col justify-between overflow-hidden bg-brand px-10 py-12 lg:flex">
      <Image
        src="/brand/logo-mark.png"
        alt=""
        width={200}
        height={200}
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-[420px] w-[420px] opacity-[0.08]"
      />
      <div className="relative z-10">
        <Logo variant="onBrand" />
      </div>
      <div className="relative z-10">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{eyebrow}</p>}
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-white text-balance">{title}</h1>
        {subtitle && <p className="mt-3 text-sm text-white/75">{subtitle}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
      <p className="relative z-10 text-xs text-white/50">Partner self-service portal</p>
    </div>
  );
}

export function RailSteps({ steps }: { steps: { label: string; state: "done" | "current" | "upcoming" }[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-center gap-3">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              s.state === "done"
                ? "bg-white text-brand-dark"
                : s.state === "current"
                  ? "border-2 border-white text-white"
                  : "border border-white/30 text-white/40"
            }`}
          >
            {s.state === "done" ? "✓" : i + 1}
          </span>
          <span className={`text-sm ${s.state === "upcoming" ? "text-white/40" : "text-white"} ${s.state === "current" ? "font-semibold" : ""}`}>
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
