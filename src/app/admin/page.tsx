import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/adminAuth";
import { listVendors } from "@/lib/tickets";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { CopyLink } from "@/components/admin/CopyLink";
import { Logo } from "@/components/brand/Logo";
import { Card } from "@/components/ui/primitives";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const authed = isValidAdminCookie(cookieStore.get(ADMIN_COOKIE)?.value);

  if (!authed) return <AdminLogin />;

  const vendors = listVendors();

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-5 py-10">
      <Logo />
      <div>
        <h1 className="font-display text-2xl font-bold">Vendor link directory</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Each row is one vendor&apos;s persistent link — send it once via WhatsApp/SMS; it stays valid
          for every future request. This page is password-gated and not something vendors ever see.
        </p>
      </div>

      <div className="grid gap-3">
        {vendors.map((v) => (
          <Card key={v.token} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{v.name}</p>
              <p className="text-xs text-ink-soft">{v.branches.join(" · ")} · {v.phone}</p>
            </div>
            <CopyLink token={v.token} />
          </Card>
        ))}
      </div>

      <p className="text-xs text-ink-soft">
        Adding real vendors here means inserting rows into the <code className="font-mono">vendors</code> table
        (<code className="font-mono">src/lib/db.ts</code>) — there&apos;s no self-serve creation form yet.
      </p>
    </div>
  );
}
