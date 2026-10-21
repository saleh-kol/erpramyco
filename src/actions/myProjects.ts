"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { getTimeFactor, calcMemberBonus } from "@/lib/project/bonus";

// ============================================================
//  ابزارهای مشترک
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

/** زیرمجموعه‌های مستقیم (برای CEO: پرسنل بدون رکورد سرپرستی) */
async function getDirectSubordinateIds(personnelId: number): Promise<number[]> {
  const isCEO = await isCurrentUserCEO();

  if (isCEO) {
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

// ============================================================
//  ۱. پروژه‌های کاربر فعلی — دست نخورده
// ============================================================
export async function getMyProjects(status: string = "Active") {
  const user = await getSession();
  if (!user) return [];

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return [];

  const assignments = await prisma.pR_Project_Assignments.findMany({
    where: { Personnel_ID: dbUser.Personnel_ID, PR_Projects: { Status: status as any } },
    include: { PR_Projects: true },
    orderBy: { Assigned_From: "desc" },
  });

  const projectsWithRole = assignments.map((a: any) => ({
    ...a.PR_Projects,
    My_Role: a.Role_In_Project,
    My_Wage: Number(a.Personnel_Wage || 0),
    My_Final_Bonus: a.Final_Bonus != null ? Number(a.Final_Bonus) : null,
    Is_Leader: a.PR_Projects.Project_Leader_ID === dbUser.Personnel_ID,
  }));

  return JSON.parse(JSON.stringify(projectsWithRole));
}

// ============================================================
//  ۲. درخواست اتمام توسط مسئول پروژه (Active → OnHold) — دست نخورده
// ============================================================
export async function requestProjectCompletionAction(formData: FormData) {
  const projectId = parseInt(formData.get("projectId") as string);

  const user = await getSession();
  if (!user) return { error: "نشست نامعتبر است" };

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return { error: "پروفایل پرسنلی یافت نشد" };

  const project = await prisma.pR_Projects.findUnique({ where: { Project_ID: projectId } });
  if (!project) return { error: "پروژه یافت نشد" };

  if (project.Project_Leader_ID && dbUser.Personnel_ID !== project.Project_Leader_ID) {
    return { error: "فقط مسئول پروژه می‌تواند اتمام پروژه را ثبت کند" };
  }
  if (project.Status !== "Active") {
    return { error: "این پروژه در وضعیت قابل اتمام نیست" };
  }

  await prisma.pR_Projects.update({
    where: { Project_ID: projectId },
    data: { Status: "OnHold" },
  });

  revalidatePath("/dashboard/my-projects");
  revalidatePath("/dashboard/leave-approvals");
  return { success: true };
}

// ============================================================
//  ۳. درخواست‌های اتمام برای من — 🔴 فیلتر سلسله‌مراتبی
//  OR: مسئول پروژه، زیرمجموعه مستقیم من است OR پروژه را من صادر کرده‌ام
//  (شرط دوم تا تب‌های تاریخچه برای صادرکننده کامل بمانند)
// ============================================================
export async function getProjectsForApproval(status: string = "Pending") {
  const me = await getCurrentPersonnelId();
  if (!me) return [];

  let whereClause: any = {};
  if (status === "Pending") whereClause.Status = "OnHold";
  else if (status === "Approved") whereClause.Status = "Completed";
  else if (status === "Rejected") whereClause.Status = "Active";

  const mySubIds = await getDirectSubordinateIds(me);

  // 🔴 فیلتر: زیرمجموعه‌های مستقیم من + پروژه‌هایی که خودم صادر کرده‌ام
  whereClause.OR = [
    ...(mySubIds.length > 0 ? [{ Project_Leader_ID: { in: mySubIds } }] : []),
    { Manager_ID: me },
  ];

  const projects = await prisma.pR_Projects.findMany({
    where: whereClause,
    include: {
      PR_Project_Assignments: { include: { Personnel: true } },
      Project_Leader: true,
    },
    orderBy: { Updated_At: "desc" },
  });
  return JSON.parse(JSON.stringify(projects));
}

// ============================================================
//  ۴. تایید/رد اتمام — 🔴 گارد سرپرست + ✅ پاداش اعضا
//  قاعده: فقط سرپرست مستقیمِ مسئول پروژه (یا CEO اگر مسئول بدون سرپرست است)
// ============================================================
export async function reviewProjectCompletionAction(formData: FormData) {
  const projectId = parseInt(formData.get("projectId") as string);
  const action = formData.get("action") as string;

  if (isNaN(projectId)) return { error: "شناسه پروژه نامعتبر است" };
  if (action !== "approve" && action !== "reject") return { error: "عملیات نامعتبر است" };

  const me = await getCurrentPersonnelId();
  if (!me) return { error: "نشست نامعتبر است" };

  const project = await prisma.pR_Projects.findUnique({
    where: { Project_ID: projectId },
    include: { PR_Project_Assignments: true },
  });
  if (!project) return { error: "پروژه یافت نشد" };

  if (project.Status !== "OnHold") {
    return { error: "این پروژه در وضعیت درخواست اتمام نیست" };
  }

  // 🔴 گارد سلسله‌مراتبی: فقط سرپرست مستقیمِ مسئول پروژه (یا CEO)
  const supRec = await prisma.pR_Supervision.findUnique({
    where: { Personnel_ID: project.Project_Leader_ID ?? 0 },
    select: { Supervisor_ID: true },
  });

  let allowed: boolean;
  if (supRec) {
    // مسئول پروژه سرپرست دارد → فقط همان نفر
    allowed = supRec.Supervisor_ID === me;
  } else {
    // مسئول، زیرمجموعه مستقیم CEO است (یا مسئول تعریف نشده) → فقط CEO
    allowed = await isCurrentUserCEO();
  }
  if (!allowed) {
    return { error: "تایید این درخواست فقط توسط سرپرست مستقیمِ مسئول پروژه (یا مدیرعامل) امکان‌پذیر است" };
  }

  // ضریب مدیر — clamp شده ۰ تا ۱۰۰
  const managerScoreRaw = formData.get("managerScore");
  const managerScore = managerScoreRaw
    ? Math.max(0, Math.min(100, Number(managerScoreRaw) || 100))
    : 100;

  if (action === "approve") {
    const now = new Date();
    const factor = getTimeFactor(project, now);

    // قاعده حفظ‌شده: گذشته از حد نهایی → لغو و صفر
    if (factor.kind === "expired") {
      await prisma.$transaction([
        prisma.pR_Project_Assignments.updateMany({
          where: { Project_ID: projectId },
          data: { Final_Bonus: 0 },
        }),
        prisma.pR_Projects.update({
          where: { Project_ID: projectId },
          data: { Status: "Cancelled", Final_Bonus: 0 },
        }),
      ]);
      revalidatePath("/dashboard/leave-approvals");
      revalidatePath("/dashboard/my-projects");
      revalidatePath("/dashboard/projects");
      return { success: true, message: "پروژه به دلیل دیرکرد لغو شد" };
    }

    // ذخیره پاداش هر عضو + جمع به‌عنوان Final_Bonus پروژه
    let totalBonus = 0;
    for (const a of project.PR_Project_Assignments) {
      const bonus = calcMemberBonus(a.Personnel_Wage, factor, managerScore);
      totalBonus += bonus;
      await prisma.pR_Project_Assignments.update({
        where: { Assignment_ID: a.Assignment_ID },
        data: { Final_Bonus: bonus },
      });
    }

    await prisma.pR_Projects.update({
      where: { Project_ID: projectId },
      data: { Status: "Completed", Final_Bonus: totalBonus, Manager_ID: me }, // ✅ ثبت تاییدکننده
    });

    revalidatePath("/dashboard/leave-approvals");
    revalidatePath("/dashboard/my-projects");
    revalidatePath("/dashboard/projects");
    return { success: true, message: `${factor.reason} — جمع پاداش تیم: ${totalBonus.toLocaleString("fa-IR")} ریال`, bonus: totalBonus };
  } else {
    await prisma.pR_Projects.update({
      where: { Project_ID: projectId },
      data: { Status: "Active" },
    });
    revalidatePath("/dashboard/leave-approvals");
    revalidatePath("/dashboard/my-projects");
    return { success: true };
  }
}