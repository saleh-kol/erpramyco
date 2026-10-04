"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

/**
 * دریافت جزئیات پرسنل
 */
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

    if (!Number.isNaN(parsedStart.getTime())) {
      start = parsedStart;
    }
  }

  if (endDate) {
    const parsedEnd = new Date(`${endDate}T23:59:59.999Z`);

    if (!Number.isNaN(parsedEnd.getTime())) {
      end = parsedEnd;
    }
  }

  const personnel = await prisma.personnel.findUnique({
    where: {
      Personnel_ID: personnelId,
    },

    include: {
      OrganizationalPosition: true,
      Unit: true,

      PR_Daily_Reports_PR_Daily_Reports_Personnel_IDToPersonnel: {
        where: {
          Report_Date: {
            gte: start,
            lte: end,
          },
        },

        orderBy: {
          Report_Date: "desc",
        },

        include: {
          PR_Work_Types: true,
          PR_Projects: true,
          PR_Work_Locations: true,
        },
      },

      PR_Commute_Logs_PR_Commute_Logs_Personnel_IDToPersonnel: {
        where: {
          Commute_Date: {
            gte: start,
            lte: end,
          },
        },

        orderBy: {
          Commute_Date: "desc",
        },
      },

      PR_Project_Assignments: {
        where: {
          Is_Active: true,
        },

        include: {
          PR_Projects: true,
        },
      },

      Tasks_AssignedTo: {
        orderBy: {
          Created_At: "desc",
        },

        take: 5,
      },
    },
  });

  return JSON.parse(JSON.stringify(personnel));
}

/**
 * فعال / غیرفعال کردن پرسنل
 */
export async function togglePersonnelStatus(formData: FormData) {
  const idValue = formData.get("id");
  const isActiveValue = formData.get("isActive");

  const id = Number(idValue);

  if (!Number.isInteger(id)) {
    throw new Error("شناسه پرسنل نامعتبر است");
  }

  const currentStatus = isActiveValue === "true";

  await prisma.personnel.update({
    where: {
      Personnel_ID: id,
    },

    data: {
      IsActive: !currentStatus,
    },
  });

  revalidatePath(`/dashboard/personnel/${id}`);
}

// ۳. اکشن تایید/رد گزارش توسط مدیر
export async function reviewReportAction(formData: FormData): Promise<void> {
  const reportId = parseInt(formData.get('reportId') as string);
  const actionType = formData.get('actionType') as string;
  const scoreStr = formData.get('score') as string;
  const difficulty = formData.get('difficulty') as string; 
  const comment = formData.get('comment') as string;

  // اصلاح شد: استفاده از Manager_Reviewed به جای Approved
  const newStatus = actionType === 'approve' ? 'Manager_Reviewed' : 'Rejected';
  
  try {
    // ۱. دریافت اطلاعات فعلی گزارش برای محاسبه ساعت موثر
    const report = await prisma.pR_Daily_Reports.findUnique({
      where: { Report_ID: reportId },
      select: { Work_Hours: true }
    });

    const workHours = Number(report?.Work_Hours || 0);
    const managerScore = scoreStr ? parseFloat(scoreStr) : 100;
    
    // ۲. محاسبه ساعت موثر (Effective Hours)
    const effectiveHours = workHours * (managerScore / 100);

    // ۳. آپدیت دیتابیس با فیلد جدید Effective_Hours
    await prisma.pR_Daily_Reports.update({
      where: { Report_ID: reportId },
      data: {
        Report_Status: newStatus,
        Manager_Score: managerScore,
        Difficulty: difficulty ? parseFloat(difficulty) : 1,
        Manager_Comment: comment || null,
        Effective_Hours: effectiveHours, // ذخیره ساعت موثر برای کش شدن و افزایش سرعت کوئری‌ها
        Reviewed_At: new Date()
      }
    })
  } catch (error: any) {
    console.error("خطا در ثبت بررسی:", error.message)
  }

  const currentPath = formData.get('currentPath') as string || '/dashboard/personnel';
  revalidatePath(currentPath);
}


 // تایید / رد ماموریت توسط مدیر
export async function reviewMissionAction(
  formData: FormData
): Promise<void> {
  const commuteIdValue = formData.get("commuteId");

  if (!commuteIdValue) {
    throw new Error("شناسه ماموریت ارسال نشده است");
  }

  const commuteId = Number(commuteIdValue);

  if (!Number.isInteger(commuteId)) {
    throw new Error("شناسه ماموریت نامعتبر است");
  }

  const actionType = String(formData.get("actionType") ?? "");
  const scoreValue = String(formData.get("score") ?? "");
  const commentValue = String(formData.get("comment") ?? "");

  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  let managerId: number | null = null;

  if (session) {
    const user = await verifySession(session);

    if (user?.userId != null) {
      managerId = Number(user.userId);
    }
  }

  try {
    await prisma.pR_Commute_Logs.update({
      where: {
        Commute_ID: commuteId,
      },

      data: {
        Is_Approved: actionType === "approve",

        Approved_By: managerId,

        Approved_At: new Date(),

        Manager_Score: scoreValue
          ? parseFloat(scoreValue)
          : null,

        Manager_Comment: commentValue || null,

        Manager_ID: managerId,
      },
    });
  } catch (error: unknown) {
    console.error(
      "خطا در بررسی ماموریت:",
      error instanceof Error ? error.message : error
    );
  }

  const currentPath =
    String(formData.get("currentPath") ?? "") ||
    "/dashboard/personnel";

  revalidatePath(currentPath);
}

/**
 * تایید / رد پروژه توسط مدیر
 */
export async function reviewProjectAction(
  formData: FormData
): Promise<void> {
  const projectIdValue = formData.get("projectId");

  if (!projectIdValue) {
    throw new Error("شناسه پروژه ارسال نشده است");
  }

  const projectId = Number(projectIdValue);

  if (!Number.isInteger(projectId)) {
    throw new Error("شناسه پروژه نامعتبر است");
  }

  const actionType = String(formData.get("actionType") ?? "");
  const scoreValue = String(formData.get("score") ?? "");
  const commentValue = String(formData.get("comment") ?? "");

  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  let managerId: number | null = null;

  if (session) {
    const user = await verifySession(session);

    if (user?.userId != null) {
      managerId = Number(user.userId);
    }
  }

  try {
    await prisma.pR_Projects.update({
      where: {
        Project_ID: projectId,
      },

      data: {
        Manager_Score: scoreValue
          ? parseFloat(scoreValue)
          : null,

        Manager_Comment: commentValue || null,

        Manager_ID: managerId,

        Status:
          actionType === "approve"
            ? "Active"
            : "OnHold",
      },
    });
  } catch (error: unknown) {
    console.error(
      "خطا در بررسی پروژه:",
      error instanceof Error ? error.message : error
    );
  }

  const currentPath =
    String(formData.get("currentPath") ?? "") ||
    "/dashboard/personnel";

  revalidatePath(currentPath);
}