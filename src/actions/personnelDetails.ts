"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session"; // <--- اضافه شد

export async function getPersonnelDetails(
  id: string,
  startDate?: string,
  endDate?: string
) {
  const personnelId = Number(id);

  if (!Number.isInteger(personnelId)) {
    throw new Error("شناسه پرسنل نامعتبر است");
  }

  let end = new Date();
  let start = new Date();
  start.setDate(start.getDate() - 7);

  if (startDate) {
    const parsedStart = new Date(`${startDate}T00:00:00.000Z`);
    if (!isNaN(parsedStart.getTime())) {
      start = parsedStart;
    }
  }

  if (endDate) {
    const parsedEnd = new Date(`${endDate}T23:59:59.999Z`);
    if (!isNaN(parsedEnd.getTime())) {
      end = parsedEnd;
    }
  }

  const personnel = await prisma.personnel.findUnique({
    where: { Personnel_ID: personnelId },
    include: {
      OrganizationalPosition: true, // <--- این خط اضافه شد
      Unit: true,                   // <--- این خط اضافه شد
      PR_Daily_Reports_PR_Daily_Reports_Personnel_IDToPersonnel: {
        where: { Report_Date: { gte: start, lte: end } },
        orderBy: { Report_Date: "desc" },
        include: {
          PR_Work_Types: true,
          PR_Projects: true,
          PR_Work_Locations: true,
        },
      },
      PR_Commute_Logs_PR_Commute_Logs_Personnel_IDToPersonnel: {
        where: { Commute_Date: { gte: start, lte: end } },
        orderBy: { Commute_Date: "desc" },
      },
      PR_Project_Assignments: {
        where: { Is_Active: true },
        include: { PR_Projects: true },
      },
    },
  });

  return JSON.parse(JSON.stringify(personnel));
}

// ۲. اکشن فعال/غیرفعال کردن پرسنل
export async function togglePersonnelStatus(formData: FormData) {
  const id = Number(formData.get("id"));
  const currentStatus = formData.get("isActive") === "true";

  await prisma.personnel.update({
    where: { Personnel_ID: id },
    data: { IsActive: !currentStatus },
  });

  revalidatePath(`/dashboard/personnel/${id}`);
}


// ۳. اکشن تایید/رد گزارش توسط مدیر
export async function reviewReportAction(formData: FormData): Promise<void> {
  const reportId = parseInt(formData.get('reportId') as string)
  const actionType = formData.get('actionType') as string
  const score = formData.get('score') as string
  const comment = formData.get('comment') as string

  const newStatus = actionType === 'approve' ? 'Manager_Reviewed' : 'Rejected'
  
  try {
    await prisma.pR_Daily_Reports.update({
      where: { Report_ID: reportId },
      data: {
        Report_Status: newStatus,
        Manager_Score: score ? parseFloat(score) : null,
        Manager_Comment: comment || null,
        Reviewed_At: new Date()
      }
    })
  } catch (error: any) {
    console.error("خطا در ثبت بررسی:", error.message)
  }

  const currentPath = formData.get('currentPath') as string || '/dashboard/personnel';
  revalidatePath(currentPath);
}

export async function reviewMissionAction(formData: FormData): Promise<void> {
  const commuteId = parseInt(formData.get('commuteId') as string)
  const actionType = formData.get('actionType') as string
  const score = formData.get('score') as string
  const comment = formData.get('comment') as string

  // --- اصلاح شده ---
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  let managerId: number | null = null;

  if (session) {
    const user = await verifySession(session)
    if (user) {
      managerId = user.userId
    }
  }
  // -----------------

  try {
    await prisma.pR_Commute_Logs.update({
      where: { Commute_ID: commuteId },
      data: {
        Is_Approved: actionType === 'approve',
        Approved_By: managerId ? Number(managerId) : null,
        Approved_At: new Date(),
        Manager_Score: score ? parseFloat(score) : null,
        Manager_Comment: comment || null,
        Manager_ID: managerId ? Number(managerId) : null
      }
    })
  } catch (error: any) {
    console.error("خطا در بررسی ماموریت:", error.message)
  }

  const currentPath = formData.get('currentPath') as string || '/dashboard/personnel';
  revalidatePath(currentPath);
}

// ۵. اکشن تایید/رد پروژه توسط مدیر
export async function reviewProjectAction(formData: FormData): Promise<void> {
  const projectId = parseInt(formData.get('projectId') as string)
  const actionType = formData.get('actionType') as string
  const score = formData.get('score') as string
  const comment = formData.get('comment') as string

  // --- اصلاح شده ---
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  let managerId: number | null = null;

  if (session) {
    const user = await verifySession(session)
    if (user) {
      managerId = user.userId
    }
  }
  // -----------------

  try {
    // آپدیت مستقیم جدول PR_Projects
    await prisma.pR_Projects.update({
      where: { Project_ID: projectId },
      data: {
        Manager_Score: score ? parseFloat(score) : null,
        Manager_Comment: comment || null,
        Manager_ID: managerId ? Number(managerId) : null,
        // اگر مدیر رد کرد، وضعیت پروژه را می‌توانیم روی OnHold بگذاریم (اختیاری)
        Status: actionType === 'approve' ? 'Active' : 'OnHold'
      }
    })
  } catch (error: any) {
    console.error("خطا در بررسی پروژه:", error.message)
  }

  const currentPath = formData.get('currentPath') as string || '/dashboard/personnel';
  revalidatePath(currentPath);
}