import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { getVendorById } from "@/lib/tickets";
import { LoginForm } from "@/components/portal/LoginForm";
import { PortalWizard } from "@/components/portal/PortalWizard";

export default async function Home() {
  const cookieStore = await cookies();
  const vendorId = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  const vendor = vendorId ? getVendorById(vendorId) : null;

  if (!vendor) return <LoginForm />;

  return (
    <PortalWizard
      vendor={{
        name: vendor.name,
        branches: vendor.branches,
        accountManagerName: vendor.accountManagerName,
      }}
    />
  );
}
