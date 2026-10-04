import { getTasks, getPersonnelForTask } from "@/actions/tasks";
import TasksClient from "./TasksClient";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusParam } = await searchParams;
  
  // پشتیبانی از وضعیت‌های جدید (Submitted و Approved)
  let status = 'Pending';
  if (statusParam === 'Submitted' || statusParam === 'Approved' || statusParam === 'Done') {
    status = statusParam;
  }

  // --- بررسی نقش کاربر فعلی ---
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  const user = session ? await verifySession(session) : null;
  const dbUser = user ? await prisma.users.findUnique({ where: { User_ID: user.userId }, include: { Personnel: true } }) : null;
  const isCEO = dbUser?.Personnel?.Role === 'CEO';
  // -------------------------------

  const tasks = await getTasks(status);
  const personnel = await getPersonnelForTask();

  // اضافه شدن isCEO به پراپ‌ها
  return <TasksClient tasks={tasks} personnel={personnel} currentStatus={status} isCEO={isCEO} />;
}