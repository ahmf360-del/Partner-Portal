import { cookies } from "next/headers";
import { STAFF_SESSION_COOKIE, verifyStaffSessionToken } from "@/lib/session";
import { getStaffById } from "@/lib/staff";
import { StaffLogin } from "@/components/staff/StaffLogin";
import { StaffQueue } from "@/components/staff/StaffQueue";

export default async function TeamPage() {
  const cookieStore = await cookies();
  const staffId = verifyStaffSessionToken(cookieStore.get(STAFF_SESSION_COOKIE)?.value);
  const staff = staffId ? getStaffById(staffId) : null;

  if (!staff) return <StaffLogin />;

  return <StaffQueue staff={{ name: staff.name, team: staff.team }} />;
}
