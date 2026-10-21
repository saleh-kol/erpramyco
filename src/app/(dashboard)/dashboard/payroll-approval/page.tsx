import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getYear, getMonth } from "date-fns-jalali";
import CEOApprovalClient from "./CEOApprovalClient";

// صفحه تایید فیش حقوقی — فقط مدیرعامل
export default async function PayrollApprovalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) redirect("/");

  const dbUser = await prisma.users.findUnique({
    where: { User_ID: session.userId },
    select: { Personnel: { select: { Role: true } } },
  });
  if (dbUser?.Personnel?.Role !== "CEO") redirect("/dashboard");

  const now = new Date();
  return <CEOApprovalClient initialYear={getYear(now)} initialMonth={getMonth(now) + 1} />;
}