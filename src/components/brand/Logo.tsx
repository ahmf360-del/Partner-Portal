// PLACEHOLDER mark — Breadfast's real logo lives at breadfast.com as SVGs this
// session couldn't fetch (network policy blocks that domain). Drop the real file
// in /public/brand and swap the badge below for an <img>/<Image> once you have it.

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const badge = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const text = size === "sm" ? "text-base" : "text-lg";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`${badge} inline-flex shrink-0 items-center justify-center rounded-xl bg-brand text-white`}
      >
        <svg viewBox="0 0 48 48" className="h-[60%] w-[60%]" role="img" aria-label="Breadfast loaf mark">
          <path
            d="M6 27c0-10 8-18 18-18s18 8 18 18v4a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5z"
            fill="currentColor"
          />
          <path d="M17 16l3 6M24 13l0 7M31 16l-3 6" stroke="var(--bf-orange)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </svg>
      </span>
      <span className={`font-display font-bold tracking-tight ${text}`}>
        bread<span className="text-brand">fast</span>
      </span>
    </div>
  );
}
