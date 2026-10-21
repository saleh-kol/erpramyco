"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

// ============================================================
//  ابزارهای مشترک
// ============================================================
async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return await verifySession(token);
}

/** User_ID نشست → Personnel_ID (Manager_ID به جدول Personnel ارجاع دارد) */
async function getCurrentPersonnelId(): Promise<number | null> {
  const user = await getSession();
  if (!user) return null;
  const dbUser = await prisma.users.findUnique({
    where: { User_ID: user.userId },
    select: { Personnel_ID: true },
  });
  return dbUser?.Personnel_ID ?? null;
}

/** مسیر برگشت امن — currentPath از فرم می‌آید، در غیر اینصورت fallback */
function revalidateTarget(currentPath: FormDataEntryValue | null, fallback: string) {
  revalidatePath(typeof currentPath === "string" && currentPath.startsWith("/") ? currentPath : fallback);
}

// ============================================================
//  ۱. فعال/غیرفعال کردن پرسنل (مستقیم به‌عنوان form action)
// ============================================================
export async function togglePersonnelStatus(formData: FormData): Promise<void> {
  const id = parseInt(formData.get("id") as string);
  const isActive = formData.get("isActive") === "true";
  if (isNaN(id)) return;

  await prisma.personnel.update({
    where: { Personnel_ID: id },
    data: { IsActive: !isActive },
  });

  revalidatePath(`/dashboard/personnel/${id}`);
  revalidatePath("/dashboard/personnel");
}

// ============================================================
//  ۲. جزئیات کامل پرسنل — صفحه /dashboard/personnel/[id]
//  (start/end اختیاری: بازه فیلتر ISO "YYYY-MM-DD")
// ============================================================
export async function getPersonnelDetails(id: string, start?: string, end?: string) {
  const personnelId = parseInt(id);
  if (isNaN(personnelId)) return null;

  // ساخت فیلتر بازه — نیمه‌شب تا آخر شب
  const dateFilter: any = {};
  if (start) {
    const d = new Date(`${start}T00:00:00`);
    if (!isNaN(d.getTime())) dateFilter.gte = d;
  }
  if (end) {
    const d = new Date(`${end}T23:59:59`);
    if (!isNaN(d.getTime())) dateFilter.lte = d;
  }
  const hasRange = Object.keys(dateFilter).length > 0;

  const personnel = await prisma.personnel.findUnique({
    where: { Personnel_ID: personnelId },
    include: {
      Production_Lines: true,
      OrganizationalPosition: true,
      Unit: true,
      // گزارش‌های روزانه — کلید رابطه دقیقاً مطابق UI کلاینت
      PR_Daily_Reports_PR_Daily_Reports_Personnel_IDToPersonnel: {
        where: hasRange ? { Report_Date: dateFilter } : undefined,
        include: { PR_Work_Types: true, PR_Work_Locations: true, PR_Projects: true },
        orderBy: [{ Report_Date: "desc" }, { Check_In: "desc" }],
      },
      // ماموریت‌ها
      PR_Commute_Logs_PR_Commute_Logs_Personnel_IDToPersonnel: {
        where: hasRange ? { Commute_Date: dateFilter } : undefined,
        orderBy: { Commute_Date: "desc" },
      },
      // پروژه‌ها
      PR_Project_Assignments: {
        include: { PR_Projects: { include: { Project_Leader: true } } },
        orderBy: { Assigned_From: "desc" },
      },
      // ابلاغیه‌ها
      Tasks_AssignedTo: {
        orderBy: { Created_At: "desc" },
        take: 10,
      },
    },
  });

  if (!personnel) return null;
  return JSON.parse(JSON.stringify(personnel));
}

// ============================================================
//  ۳. بررسی گزارش روزانه (تایید/رد + ضریب + سختی + نظر + ✅ اصلاح نوع فعالیت)
// ============================================================
export async function reviewReportAction(formData: FormData) {
  const reportId = parseInt(formData.get("reportId") as string);
  const actionType = formData.get("actionType") as string; // "approve" | "reject"
  const score = formData.get("score") as string;
  const difficulty = formData.get("difficulty") as string;
  const comment = formData.get("comment") as string;
  const workTypeId = formData.get("workTypeId") as string; // ✅ جدید: اصلاح نوع فعالیت
  const currentPath = formData.get("currentPath");

  if (isNaN(reportId)) return { error: "شناسه گزارش نامعتبر است" };
  if (actionType !== "approve" && actionType !== "reject") return { error: "عملیات نامعتبر است" };

  const managerId = await getCurrentPersonnelId();
  if (!managerId) return { error: "نشست نامعتبر است" };

  // ✅ اعتبارسنجی نوع فعالیت: فقط اگر ارسال شده، باید فعال و موجود باشد
  let newWorkTypeId: number | undefined = undefined;
  if (workTypeId && workTypeId.trim() !== "") {
    const parsed = parseInt(workTypeId);
    if (isNaN(parsed)) return { error: "نوع فعالیت نامعتبر است" };

    const workType = await prisma.pR_Work_Types.findFirst({
      where: { Work_Type_ID: parsed, Is_Active: true },
      select: { Work_Type_ID: true },
    });
    if (!workType) return { error: "نوع فعالیت انتخاب‌شده یافت نشد یا غیرفعال است" };

    newWorkTypeId = parsed;
  }

  await prisma.pR_Daily_Reports.update({
    where: { Report_ID: reportId },
    data: {
      Report_Status: (actionType === "reject" ? "Rejected" : "Manager_Reviewed") as any,
      Manager_Score: score ? Math.max(0, Math.min(100, parseFloat(score))) : null,
      Difficulty: difficulty ? parseFloat(difficulty) : undefined,
      Manager_Comment: comment || null,
      Manager_ID: managerId,
      Reviewed_At: new Date(),
      // ✅ فقط اگر مدیر نوع جدیدی انتخاب کرده باشد — وگرنه دست‌نخورده
      ...(newWorkTypeId !== undefined ? { Work_Type_ID: newWorkTypeId } : {}),
    },
  });

  revalidateTarget(currentPath, "/dashboard/leave-approvals");
  return { success: true };
}

// ============================================================
//  ۴. بررسی ماموریت — منطق چرخه حیات ماموریت‌ها (هماهنگ با ماژول ماموریت)
//  approve: Completed → تایید نهایی | غیر آن → InProgress
//  reject:  → Rejected
// ============================================================
export async function reviewMissionAction(formData: FormData) {
  // پذیرش هر دو نام فیلد (بسته به hidden input مودال)
  const idRaw = (formData.get("commuteId") || formData.get("missionId")) as string;
  const commuteId = parseInt(idRaw as string);
  const actionType = formData.get("actionType") as string;
  const score = formData.get("score") as string;
  const comment = formData.get("comment") as string;
  const currentPath = formData.get("currentPath");

  if (isNaN(commuteId)) return { error: "شناسه ماموریت نامعتبر است" };
  if (actionType !== "approve" && actionType !== "reject") return { error: "عملیات نامعتبر است" };

  const managerId = await getCurrentPersonnelId();
  if (!managerId) return { error: "نشست نامعتبر است" };

  const mission = await prisma.pR_Commute_Logs.findUnique({ where: { Commute_ID: commuteId } });
  if (!mission) return { error: "ماموریت یافت نشد" };

  let finalStatus = mission.Status || "InProgress";
  let finalIsApproved = mission.Is_Approved ?? false;

  if (actionType === "approve") {
    if (mission.Status === "Completed") {
      finalIsApproved = true; // ارزیابی نهایی
    } else {
      finalStatus = "InProgress"; // شروع ماموریت
    }
  } else {
    finalStatus = "Rejected";
    finalIsApproved = false;
  }

  await prisma.pR_Commute_Logs.update({
    where: { Commute_ID: commuteId },
    data: {
      Status: finalStatus,
      Is_Approved: finalIsApproved,
      Manager_Score: score ? Math.max(0, Math.min(100, parseFloat(score))) : null,
      Manager_Comment: comment || null,
      Manager_ID: managerId,
      Approved_By: managerId,
      Approved_At: new Date(),
    },
  });

  revalidateTarget(currentPath, "/dashboard/missions");
  revalidatePath("/dashboard/my-missions");
  return { success: true };
}

// ============================================================
//  ۵. ارزیابی پروژه از صفحه پرسنل
//  approve: ذخیره ضریب/نظر/ارزیاب روی پروژه
//  reject:  ذخیره ارزیابی + بازگشت پروژه OnHold به Active (رد درخواست اتمام)
// ============================================================
export async function reviewProjectAction(formData: FormData) {
  const actionType = formData.get("actionType") as string;
  const score = formData.get("score") as string;
  const comment = formData.get("comment") as string;
  const currentPath = formData.get("currentPath");

  // پذیرش هر دو نام فیلد: projectId یا assignmentId
  let projectId: number | null = null;
  const projectIdRaw = formData.get("projectId");
  const assignmentIdRaw = formData.get("assignmentId");

  if (projectIdRaw) {
    projectId = parseInt(projectIdRaw as string);
  } else if (assignmentIdRaw) {
    const assignment = await prisma.pR_Project_Assignments.findUnique({
      where: { Assignment_ID: parseInt(assignmentIdRaw as string) },
      select: { Project_ID: true },
    });
    projectId = assignment?.Project_ID ?? null;
  }

  if (projectId === null || isNaN(projectId)) return { error: "شناسه پروژه نامعتبر است" };
  if (actionType !== "approve" && actionType !== "reject") return { error: "عملیات نامعتبر است" };

  const managerId = await getCurrentPersonnelId();
  if (!managerId) return { error: "نشست نامعتبر است" };

  await prisma.pR_Projects.update({
    where: { Project_ID: projectId },
    data: {
      Manager_Score: score ? Math.max(0, Math.min(100, parseFloat(score))) : null,
      Manager_Comment: comment || null,
      Manager_ID: managerId,
      // رد کردن از صفحه پرسنل = بازگشت درخواست اتمام (در صورت وجود)
      ...(actionType === "reject" ? { Status: "Active" } : {}),
    },
  });

  revalidateTarget(currentPath, "/dashboard/projects");
  revalidatePath("/dashboard/my-projects");
  return { success: true };
}