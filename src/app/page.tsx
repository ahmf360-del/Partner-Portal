import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { BrandRail } from "@/components/brand/BrandRail";
import { Card } from "@/components/ui/primitives";

export default function Home() {
  return (
    <div className="flex min-h-dvh">
      <BrandRail
        eyebrow="A Supermarket In Your Pocket"
        title="Partner Self-Service Portal"
        subtitle="One link per restaurant partner, for finance, discounts, tech support, and menu requests — routed automatically, tracked in one place."
      />
      <div className="flex flex-1 flex-col justify-center px-5 py-10">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="lg:hidden">
          <h1 className="font-display text-2xl font-bold">Breadfast Partner Portal</h1>
        </div>
        <p className="text-sm text-ink-soft">
          Vendors don&apos;t land here — each restaurant partner gets their own private link
          (<code className="font-mono">/p/&lt;token&gt;</code>), sent once via WhatsApp/SMS, that they
          reuse for every future request and to check status.
        </p>

        <Card className="p-5">
          <p className="text-sm font-medium">Account manager?</p>
          <p className="mt-1 text-sm text-ink-soft">
            Vendor links live in a password-gated directory, not here — this page stays public and
            doesn&apos;t list them.
          </p>
          <Link
            href="/admin"
            className="mt-3 inline-flex rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Open link directory →
          </Link>
        </Card>
        </div>
      </div>
    </div>
  );
}
