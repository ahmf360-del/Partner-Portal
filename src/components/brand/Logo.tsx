import Image from "next/image";

// Real mark — public/brand/logo-mark.png is the user-supplied brand reference
// image, untouched (no recolor/redraw/rotate). Corner rounding below is a
// presentational crop, not an edit to the artwork itself. On a magenta
// background the mark's own square edge is the same color as the page, so it
// reads as just the white loop floating — no badge needed there.

export function Logo({ size = "md", variant = "default" }: { size?: "sm" | "md"; variant?: "default" | "onBrand" }) {
  const badge = size === "sm" ? 28 : 36;
  const text = size === "sm" ? "text-base" : "text-lg";
  const onBrand = variant === "onBrand";

  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/brand/logo-mark.png"
        alt="Breadfast"
        width={badge}
        height={badge}
        className={onBrand ? "shrink-0" : "shrink-0 rounded-[28%]"}
        priority
      />
      <span className={`font-display font-bold tracking-tight ${text} ${onBrand ? "text-white" : ""}`}>
        bread{onBrand ? "fast" : <span className="text-brand">fast</span>}
      </span>
    </div>
  );
}
