import { notFound } from "next/navigation";
import { getVendorByToken } from "@/lib/tickets";
import { maskPhone } from "@/lib/format";
import { PortalWizard } from "@/components/portal/PortalWizard";

export default async function VendorPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const vendor = getVendorByToken(token);
  if (!vendor) notFound();

  return (
    <PortalWizard
      token={token}
      vendor={{
        name: vendor.name,
        branches: vendor.branches,
        maskedPhone: maskPhone(vendor.phone),
        accountManagerName: vendor.accountManagerName,
      }}
    />
  );
}
