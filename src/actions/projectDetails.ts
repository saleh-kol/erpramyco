"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { getTimeFactor, calcMemberBonus } from "@/lib/project/bonus";

// ============================================================
//  ابزارها
// ============================================================
async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return await verifySession(token);
}

async function getCurrentPersonnelId(): Promise<number | null> {
  const user = await getSession();
  if (!user) return null;
  const dbUser = await prisma.users.findUnique({
    where: { User_ID: user.userId },
    select: { Personnel_ID: true },
  });
  return dbUser?.Personnel_ID ?? null;
}

async function isCurrentUserCEO(): Promise<boolean> {
  const user = await getSession();
  if (!user) return false;
  const dbUser = await prisma.users.findUnique({
    where: { User_ID: user.userId },
    include: { Personnel: { select: { Role: true } } },
  });
  return dbUser?.Personnel?.Role === "CEO";
}

/** 🔒 قاعده دسترسی: سرپرست مستقیمِ مسئول پروژه، یا CEO (اگر مسئول زیرمجموعه CEO است یا تعریف نشده) */
async function canManageProject(projectLeaderId: number | null): Promise<boolean> {
  const me = await getCurrentPersonnelId();
  if (!me) return false;

  if (!projectLeaderId) return await isCurrentUserCEO();

  const supRec = await prisma.pR_Supervision.findUnique({
    where: { Personnel_ID: projectLeaderId },
    select: { Supervisor_ID: true },
  });

  if (supRec) return supRec.Supervisor_ID === me;
  return await isCurrentUserCEO();
}

// ============================================================
//  ۱. اطلاعات کامل پروژه — 🔒 گارد مشاهده
//  (CEO | صادرکننده | مسئول پروژه | عضو | سرپرستِ مسئول)
// ============================================================
export async function getProjectDetails(id: string) {
  const projectId = parseInt(id);
  if (isNaN(projectId)) return null;

  const project = await prisma.pR_Projects.findUnique({
    where: { Project_ID: projectId },
    include: {
      Project_Leader: true,
      PR_Project_Assignments: { include: { Personnel: true } },
      PR_Project_Phases: {
        include: {
          PR_Phase_Assignments: { include: { Personnel: true } },
        },
        orderBy: { Start_Date: "asc" },
      },
    },
  });

  if (!project) return null;

  // 🔒 گارد مشاهده
  const me = await getCurrentPersonnelId();
  if (!me) return null;

  const isCEO = await isCurrentUserCEO();
  const isMember = project.PR_Project_Assignments.some((a: any) => a.Personnel_ID === me);

  if (!isCEO && project.Manager_ID !== me && project.Project_Leader_ID !== me && !isMember) {
    // سرپرستِ مسئول پروژه هم مجاز است
    let isSupervisor = false;
    if (project.Project_Leader_ID) {
      const supRec = await prisma.pR_Supervision.findUnique({
        where: { Personnel_ID: project.Project_Leader_ID },
        select: { Supervisor_ID: true },
      });
      isSupervisor = supRec?.Supervisor_ID === me;
    }
    if (!isSupervisor) return null; // دسترسی ندارید — صفحه «یافت نشد» نشان می‌دهد
  }

  return JSON.parse(JSON.stringify(project));
}

// ============================================================
//  ۲. ویرایش + ارزیابی — 🔴 گارد + ✅ ذخیره پاداش اعضا هنگام Completed
//  (همان فرمول reviewProjectCompletionAction — منبع واحد lib/project/bonus)
// ============================================================
export async function updateProjectAction(formData: FormData) {
  const projectId = parseInt(formData.get("projectId") as string);
  const managerScore = formData.get("managerScore") as string;
  const status = formData.get("status") as string;
  const managerComment = formData.get("managerComment") as string;

  if (isNaN(projectId)) return { error: "شناسه پروژه نامعتبر است" };
  if (!["Active", "Completed", "OnHold", "Cancelled"].includes(status)) {
    return { error: "وضعیت نامعتبر است" };
  }

  try {
    const me = await getCurrentPersonnelId();
    if (!me) return { error: "نشست نامعتبر است" };

    const project = await prisma.pR_Projects.findUnique({
      where: { Project_ID: projectId },
      include: { PR_Project_Assignments: true },
    });
    if (!project) return { error: "پروژه یافت نشد" };

    // 🔒 گارد سلسله‌مراتبی
    const allowed = await canManageProject(project.Project_Leader_ID);
    if (!allowed) {
      return { error: "ارزیابی این پروژه فقط توسط سرپرست مستقیمِ مسئول پروژه (یا مدیرعامل) امکان‌پذیر است" };
    }

    // ضریب clamp شده ۰ تا ۱۰۰
    const score = managerScore ? Math.max(0, Math.min(100, parseFloat(managerScore) || 0)) : 100;

    await prisma.pR_Projects.update({
      where: { Project_ID: projectId },
      data: {
        Manager_Score: score,
        Status: status,
        Manager_Comment: managerComment || null,
        Manager_ID: me, // ✅ چه کسی ارزیابی کرد
      },
    });

    // ✅ هنگام Completed: پاداش هر عضو با منبع واحد محاسبه و ذخیره می‌شود
    if (status === "Completed") {
      const factor = getTimeFactor(project, new Date()); // تحویل = الان
      let totalBonus = 0;
      for (const a of project.PR_Project_Assignments) {
        const bonus = calcMemberBonus(a.Personnel_Wage, factor, score);
        totalBonus += bonus;
        await prisma.pR_Project_Assignments.update({
          where: { Assignment_ID: a.Assignment_ID },
          data: { Final_Bonus: bonus },
        });
      }
      await prisma.pR_Projects.update({
        where: { Project_ID: projectId },
        data: { Final_Bonus: totalBonus },
      });
    } else {
      // خروج از Completed → پاکسازی پاداش‌های کهنه
      await prisma.pR_Project_Assignments.updateMany({
        where: { Project_ID: projectId },
        data: { Final_Bonus: null },
      });
      if (project.Final_Bonus != null) {
        await prisma.pR_Projects.update({
          where: { Project_ID: projectId },
          data: { Final_Bonus: null },
        });
      }
    }
  } catch (error: any) {
    console.error("خطا در بروزرسانی پروژه:", error.message);
    return { error: `خطا در بروزرسانی: ${error.message}` };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/my-projects");
  return { success: true };
}

// ============================================================
//  ۳. حذف کامل — 🔴 گارد + تراکنش (پاکسازی کامل cascade)
// ============================================================
export async function deleteProjectAction(formData: FormData) {
  const projectId = parseInt(formData.get("projectId") as string);
  if (isNaN(projectId)) return { error: "شناسه نامعتبر است" };

  try {
    const me = await getCurrentPersonnelId();
    if (!me) return { error: "نشست نامعتبر است" };

    const project = await prisma.pR_Projects.findUnique({
      where: { Project_ID: projectId },
      select: { Manager_ID: true, Project_Leader_ID: true },
    });
    if (!project) return { error: "پروژه یافت نشد" };

    // 🔒 گارد: صادرکننده یا سرپرستِ مسئول یا CEO
    const isCEO = await isCurrentUserCEO();
    const isCreator = project.Manager_ID === me;
    let isSupervisor = false;
    if (project.Project_Leader_ID) {
      const supRec = await prisma.pR_Supervision.findUnique({
        where: { Personnel_ID: project.Project_Leader_ID },
        select: { Supervisor_ID: true },
      });
      isSupervisor = supRec?.Supervisor_ID === me;
    }
    if (!isCEO && !isCreator && !isSupervisor) {
      return { error: "حذف این پروژه فقط توسط صادرکننده یا سرپرست مستقیمِ مسئول پروژه امکان‌پذیر است" };
    }

    await prisma.$transaction([
      // ۱. تخصیص‌های پرسنل
      prisma.pR_Project_Assignments.deleteMany({ where: { Project_ID: projectId } }),
      // ۲. قطع لینک گزارش‌های روزانه (تاریخچه کارکرد حفظ شود)
      prisma.pR_Daily_Reports.updateMany({ where: { Project_ID: projectId }, data: { Project_ID: null } }),
      // ۳. اعضای فازها
      prisma.pR_Phase_Assignments.deleteMany({
        where: { Phase_ID: { in: await prisma.pR_Project_Phases.findMany({ where: { Project_ID: projectId }, select: { Phase_ID: true } }).then((ps) => ps.map((p) => p.Phase_ID)) } },
      }),
      // ۴. فازها
      prisma.pR_Project_Phases.deleteMany({ where: { Project_ID: projectId } }),
      // ۵. خود پروژه
      prisma.pR_Projects.delete({ where: { Project_ID: projectId } }),
    ]);
  } catch (error: any) {
    console.error("خطا در حذف پروژه:", error.message);
    return { error: `خطا در حذف پروژه: ${error.message}` };
  }

  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/my-projects");
  return { success: true };
}