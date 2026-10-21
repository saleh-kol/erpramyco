"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { TASK_STATUS, TASK_VALID_STATUSES } from "@/lib/task/constants";

// ============================================================
//  ابزارهای احراز هویت
// ============================================================
async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return await verifySession(token);
}

async function getCurrentPersonnelId(): Promise<number | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const dbUser = await prisma.users.findUnique({
    where: { User_ID: user.userId },
    select: { Personnel_ID: true },
  });
  return dbUser?.Personnel_ID ?? null;
}

async function isCurrentUserCEO(): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  const dbUser = await prisma.users.findUnique({
    where: { User_ID: user.userId },
    include: { Personnel: { select: { Role: true } } },
  });
  return dbUser?.Personnel?.Role === "CEO";
}

// ============================================================
//  ⭐ هسته منطق سرپرستی
//  زیرمجموعه‌های مستقیم X = کسانی که سرپرستشان X است
//  (برای CEO: کسانی که هیچ رکورد سرپرستی ندارند)
// ============================================================
async function getDirectSubordinateIds(personnelId: number): Promise<number[]> {
  const isCEO = await isCurrentUserCEO();

  if (isCEO) {
    // کسانی که رکورد سرپرستی دارند → مستقیم زیر دیگران‌اند
    const assigned = await prisma.pR_Supervision.findMany({ select: { Personnel_ID: true } });
    const assignedSet = new Set(assigned.map((a) => a.Personnel_ID));
    const candidates = await prisma.personnel.findMany({
      where: { IsActive: true, Role: { not: "CEO" } },
      select: { Personnel_ID: true },
    });
    return candidates.filter((c) => !assignedSet.has(c.Personnel_ID)).map((c) => c.Personnel_ID);
  }

  const rows = await prisma.pR_Supervision.findMany({
    where: { Supervisor_ID: personnelId },
    include: { Personnel: { select: { IsActive: true } } },
  });
  return rows.filter((r) => r.Personnel?.IsActive).map((r) => r.Personnel_ID);
}

/** سرپرست مستقیم یک پرسنل — null یعنی زیرمجموعه مستقیم CEO */
async function getDirectSupervisorId(personnelId: number): Promise<number | null> {
  const rec = await prisma.pR_Supervision.findUnique({
    where: { Personnel_ID: personnelId },
    select: { Supervisor_ID: true },
  });
  return rec?.Supervisor_ID ?? null;
}

/** برای page.tsx */
export async function checkIsCEO(): Promise<boolean> {
  return await isCurrentUserCEO();
}

// ============================================================
//  ۱) لیست ابلاغیه‌ها (نمای مدیر) — 🔴 فیلتر سلسله‌مراتبی
//  OR: (ابلاغیه‌هایی که من صادر کردم) OR (ابلاغیه‌های زیرمجموعه‌هایم)
// ============================================================
export async function getTasks(status: string = TASK_STATUS.PENDING) {
  const safeStatus = TASK_VALID_STATUSES.includes(status) ? status : TASK_STATUS.PENDING;

  const me = await getCurrentPersonnelId();
  if (!me) return [];

  const mySubIds = await getDirectSubordinateIds(me);

  const tasks = await prisma.pR_Tasks.findMany({
    where: {
      Status: safeStatus,
      OR: [
        { Assigned_By: me }, // صادرکننده بودم
        ...(mySubIds.length > 0 ? [{ Assigned_To: { in: mySubIds } }] : []), // مخاطب، زیرمجموعه من است
      ],
    },
    include: {
      Personnel_AssignedTo: true,
      Personnel_AssignedBy: true, // صادرکننده
    },
    orderBy: { Created_At: "desc" },
  });

  return JSON.parse(JSON.stringify(tasks));
}

// ============================================================
//  ۲) مخاطبین مجاز صدور — 🔴 فقط زیرمجموعه‌های مستقیم
// ============================================================
export async function getPersonnelForTask() {
  const me = await getCurrentPersonnelId();
  if (!me) return [];

  const eligibleIds = await getDirectSubordinateIds(me);
  if (eligibleIds.length === 0) return [];

  const personnel = await prisma.personnel.findMany({
    where: { Personnel_ID: { in: eligibleIds }, IsActive: true },
    select: {
      Personnel_ID: true,
      Full_Name: true,
      Personnel_Code: true,
      Role: true,
      Personal_Image_Path: true,
      OrganizationalPosition: true,
      Unit: true,
    },
    orderBy: { Full_Name: "asc" },
  });

  return JSON.parse(JSON.stringify(personnel));
}

// ============================================================
//  ۳) صدور ابلاغیه — 🔒 اعتبارسنجی سمت سرور: فقط زیرمجموعه مستقیم
// ============================================================
export async function createTaskAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const dueDate = formData.get("dueDate") as string;
  const priority = formData.get("priority") as string;
  const personnelIds = formData.getAll("personnelId").map((id) => parseInt(id as string)).filter((id) => !isNaN(id));

  if (!title?.trim()) return { error: "موضوع ابلاغیه الزامی است" };
  if (personnelIds.length === 0) return { error: "حداقل یک مخاطب انتخاب کنید" };

  const me = await getCurrentPersonnelId();
  if (!me) return { error: "نشست نامعتبر است — دوباره وارد شوید" };

  // 🔒 گارد سروری: هر مخاطب باید زیرمجموعه مستقیم من باشد
  const allowedIds = new Set(await getDirectSubordinateIds(me));
  const invalid = personnelIds.filter((id) => !allowedIds.has(id));
  if (invalid.length > 0) {
    return { error: "فقط می‌توانید به زیرمجموعه‌های مستقیم خود ابلاغیه صادر کنید" };
  }

  try {
    await prisma.pR_Tasks.createMany({
      data: personnelIds.map((pId) => ({
        Assigned_To: pId,
        Assigned_By: me,
        Title: title.trim(),
        Description: description || null,
        Due_Date: dueDate ? new Date(dueDate) : null,
        Priority: priority || "Normal",
        Status: TASK_STATUS.PENDING,
      })),
    });
  } catch (error: any) {
    console.error("خطا در ثبت ابلاغیه:", error.message);
    return { error: `خطا در صدور ابلاغیه: ${error.message}` };
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/my-tasks");
  return { success: true };
}

// ============================================================
//  ۴) ابلاغیه‌های من (نمای کارمند) — دست نخورده
// ============================================================
export async function getMyTasks(status?: string) {
  const personnelId = await getCurrentPersonnelId();
  if (!personnelId) return [];

  const whereClause: any = { Assigned_To: personnelId };
  if (status && status !== "All") {
    whereClause.Status = TASK_VALID_STATUSES.includes(status) ? status : TASK_STATUS.PENDING;
  }

  const tasks = await prisma.pR_Tasks.findMany({
    where: whereClause,
    include: { Reviewer: { select: { Full_Name: true } } }, 
    orderBy: { Created_At: "desc" },
  });
  return JSON.parse(JSON.stringify(tasks));
}

// ============================================================
//  ۵) تکمیل توسط کارمند — دست نخورده (Submitted → یک پله بالاتر می‌رود)
// ============================================================
export async function completeTaskAction(formData: FormData) {
  const taskId = parseInt(formData.get("taskId") as string);
  const note = (formData.get("note") as string)?.trim() || null;

  if (isNaN(taskId)) return { error: "شناسه ابلاغیه نامعتبر است" };

  const personnelId = await getCurrentPersonnelId();
  if (!personnelId) return { error: "نشست نامعتبر است" };

  const task = await prisma.pR_Tasks.findUnique({ where: { Task_ID: taskId } });
  if (!task) return { error: "ابلاغیه یافت نشد" };
  if (task.Assigned_To !== personnelId) return { error: "این ابلاغیه متعلق به شما نیست" };
  if (task.Status !== TASK_STATUS.PENDING)
    return { error: "این ابلاغیه در وضعیت فعلی قابل تکمیل نیست" };

  try {
    await prisma.pR_Tasks.update({
      where: { Task_ID: taskId },
      data: { Status: TASK_STATUS.SUBMITTED, Completion_Note: note },
    });
  } catch (error: any) {
    return { error: `خطا در ثبت انجام ابلاغیه: ${error.message}` };
  }

  revalidatePath("/dashboard/my-tasks");
  revalidatePath("/dashboard/tasks");
  return { success: true };
}

// ============================================================
//  ۶) بررسی — 🔴 فقط سرپرست مستقیم مخاطب ابلاغیه (نه لزوماً CEO)
// ============================================================
export async function reviewTaskAction(formData: FormData) {
  const taskId = parseInt(formData.get("taskId") as string);
  const action = formData.get("action") as string; // "approve" | "reject"

  if (isNaN(taskId)) return { error: "شناسه ابلاغیه نامعتبر است" };
  if (action !== "approve" && action !== "reject") return { error: "عملیات نامعتبر است" };

  const me = await getCurrentPersonnelId();
  if (!me) return { error: "نشست نامعتبر است" };

  const task = await prisma.pR_Tasks.findUnique({ where: { Task_ID: taskId } });
  if (!task) return { error: "ابلاغیه یافت نشد" };
  if (task.Status !== TASK_STATUS.SUBMITTED)
    return { error: "فقط ابلاغیه‌های در انتظار تایید قابل بررسی هستند" };

  // 🔒 فقط سرپرست مستقیمِ مخاطب ابلاغیه
  const directSupervisorId = await getDirectSupervisorId(task.Assigned_To);

  if (directSupervisorId === null) {
    // مخاطب، زیرمجموعه مستقیم CEO است → فقط CEO
    const isCEO = await isCurrentUserCEO();
    if (!isCEO) return { error: "بررسی این ابلاغیه فقط توسط مدیرعامل امکان‌پذیر است" };
  } else if (directSupervisorId !== me) {
    return { error: "فقط سرپرست مستقیم کارمند می‌تواند این ابلاغیه را بررسی کند" };
  }

  const newStatus = action === "approve" ? TASK_STATUS.APPROVED : TASK_STATUS.PENDING;

  try {
    await prisma.pR_Tasks.update({
      where: { Task_ID: taskId },
      data: { Status: newStatus, Reviewed_By: me, Reviewed_At: new Date() }, // ✅ ردیاب تاییدکننده
    });
  } catch (error: any) {
    return { error: `خطا: ${error.message}` };
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/my-tasks");
  return { success: true };
}

/** برای Server Component ها — شناسه پرسنل کاربر فعلی */
export async function getCurrentPersonnelIdInternal(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const user = await verifySession(token);
  if (!user) return null;
  const dbUser = await prisma.users.findUnique({
    where: { User_ID: user.userId },
    select: { Personnel_ID: true },
  });
  return dbUser?.Personnel_ID ?? null;
}