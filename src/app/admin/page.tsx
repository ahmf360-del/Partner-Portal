import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/adminAuth";
import { listVendors } from "@/lib/tickets";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { VendorCredentials } from "@/components/admin/VendorCredentials";
import { Logo } from "@/components/brand/Logo";
import { Card } from "@/components/ui/primitives";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const authed = isValidAdminCookie(cookieStore.get(ADMIN_COOKIE)?.value);

  if (!authed) return <AdminLogin />;

  const vendors = listVendors();

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-5 py-10 lg:px-10">
      <Logo />
      <div>
        <h1 className="font-display text-2xl font-bold">Vendor accounts</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Each vendor signs in with a username and password — no OTP, no per-vendor link. Reset a
          password here and relay the new one to the vendor yourself (phone, WhatsApp, in person).
          This page is password-gated and not something vendors ever see.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((v) => (
          <Card key={v.id} className="flex flex-col gap-3 p-4">
            <div>
              <p className="font-semibold">{v.name}</p>
              <p className="text-xs text-ink-soft">{v.branches.join(" · ")}</p>
              <p className="text-xs text-ink-soft">{v.phone}</p>
            </div>
            <VendorCredentials vendorId={v.id} username={v.username} />
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
