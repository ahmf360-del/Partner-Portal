import type { Category } from "@/lib/types";

const PATHS: Record<Category, React.ReactNode> = {
  finance: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2.2" />
      <path d="M3 10.5h18" />
      <path d="M7 14.5h4" />
    </>
  ),
  discounts: (
    <>
      <path d="M12.6 3.4 20 10.8a2 2 0 0 1 0 2.8l-6 6a2 2 0 0 1-2.8 0l-7.4-7.4A2 2 0 0 1 3.2 11V5.2A1.8 1.8 0 0 1 5 3.4h5.8a2 2 0 0 1 1.8 1z" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  tech: (
    <>
      <rect x="5" y="2.5" width="14" height="19" rx="2.3" />
      <path d="M10.3 18.2h3.4" />
    </>
  ),
  menu: (
    <>
      <path d="M7 2.5v7.8a2.3 2.3 0 0 0 4.6 0V2.5" />
      <path d="M9.3 2.5v6.4" />
      <path d="M9.3 10.3v11.2" />
      <path d="M16.8 2.5c-1.7 0-2.8 2-2.8 4.8s1.1 4.8 2.8 4.8v9.6" />
    </>
  ),
  other: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.2" />
      <path d="M3.3 6.4 12 13l8.7-6.6" />
    </>
  ),
};

export function CategoryIcon({ category, className = "h-6 w-6" }: { category: Category; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[category]}
    </svg>
  );
}
