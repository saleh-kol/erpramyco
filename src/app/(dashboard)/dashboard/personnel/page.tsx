import { getPersonnel } from "@/actions/personnel";
import { getRolesAndUnits } from "@/actions/roles";
import PersonnelClient from "./PersonnelClient";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export default async function PersonnelPage() {
  const personnel = await getPersonnel();
  const { positions, units } = await getRolesAndUnits();

  // --- بررسی نقش کاربر فعلی ---
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  const user = session ? await verifySession(session) : null;
  const dbUser = user ? await prisma.users.findUnique({ where: { User_ID: user.userId }, include: { Personnel: true } }) : null;
  const isCEO = dbUser?.Personnel?.Role === 'CEO';
  // ---------------------------

  return <PersonnelClient personnel={personnel} positions={positions} units={units} isCEO={isCEO} />;
}