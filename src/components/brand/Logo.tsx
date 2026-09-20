import Image from "next/image";

// Real mark — public/brand/logo-mark.png is the user-supplied brand reference
// image, untouched (no recolor/redraw/rotate). Corner rounding below is a
// presentational crop, not an edit to the artwork itself.

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const badge = size === "sm" ? 28 : 36;
  const text = size === "sm" ? "text-base" : "text-lg";

  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/brand/logo-mark.png"
        alt="Breadfast"
        width={badge}
        height={badge}
        className="shrink-0 rounded-[28%]"
        priority
      />
      <span className={`font-display font-bold tracking-tight ${text}`}>
        bread<span className="text-brand">fast</span>
      </span>
    </div>
  );
}
