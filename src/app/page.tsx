import { listVendors } from "@/lib/tickets";
import { Logo } from "@/components/brand/Logo";
import { Card } from "@/components/ui/primitives";

export default function Home() {
  const vendors = listVendors();

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-5 py-10">
      <Logo />
      <div>
        <h1 className="font-display text-2xl font-bold">Partner Portal — v1</h1>
        <p className="mt-1 text-sm text-ink-soft">
          This isn&apos;t a page vendors ever see — it&apos;s where the persistent per-vendor links come from.
          In production each link is sent once via WhatsApp/SMS; for now, open one of the demo links below
          to try the vendor-side flow end to end.
        </p>
      </div>

      <div className="grid gap-3">
        {vendors.map((v) => (
          <Card key={v.token} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{v.name}</p>
              <p className="text-xs text-ink-soft">{v.branches.join(" · ")}</p>
            </div>
            <a href={`/p/${v.token}`} className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
              Open link
            </a>
          </Card>
        ))}
      </div>

      <p className="text-xs text-ink-soft">
        Vendor identity comes from the link itself (<code className="font-mono">/p/&lt;token&gt;</code>) plus a
        phone-code check — there&apos;s no separate login screen, matching the design doc.
      </p>
    </div>
  );
}
