"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

// ============================================================
//  ابزارهای احراز هویت + سرپرستی
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

/** سرپرست مستقیم یک پرسنل — null یعنی زیرمجموعه مستقیم CEO */
async function getDirectSupervisorId(personnelId: number): Promise<number | null> {
  const rec = await prisma.pR_Supervision.findUnique({
    where: { Personnel_ID: personnelId },
    select: { Supervisor_ID: true },
  });
  return rec?.Supervisor_ID ?? null;
}

/** ⭐ export گم‌شده — برای page.tsx: صلاحیت‌های کاربر فعلی */
export async function checkProjectPermissions(): Promise<{ subordinateCount: number; isCEO: boolean }> {
  const isCEO = await isCurrentUserCEO();
  const me = await getCurrentPersonnelId();
  if (!me) return { subordinateCount: 0, isCEO };
  const subs = await getDirectSubordinateIds(me);
  return { subordinateCount: subs.length, isCEO };
}

// ============================================================
//  ۱) لیست پروژه‌ها — فیلتر سلسله‌مراتبی
//  OR: پروژه‌هایی که من ثبت کردم OR پروژه‌هایی که مسئولشان زیرمجموعه مستقیم من است
// ============================================================
export async function getProjects(status: "Active" | "Completed" | "Cancelled" | "OnHold" = "Active") {
  const me = await getCurrentPersonnelId();
  if (!me) return [];

  const mySubIds = await getDirectSubordinateIds(me);

  const projects = await prisma.pR_Projects.findMany({
    where: {
      Status: status,
      OR: [
        { Manager_ID: me }, // ثبت‌کننده
        ...(mySubIds.length > 0
          ? [{ Project_Leader_ID: { in: mySubIds } }] // مسئول پروژه، زیرمجموعه مستقیم من
          : []),
      ],
    },
    include: {
      Project_Leader: true,
      PR_Project_Assignments: { include: { Personnel: true } },
    },
    orderBy: { Created_At: "desc" },
  });

  return JSON.parse(JSON.stringify(projects));
}

// ============================================================
//  ۲) پرسنل برای انتخاب تیم — فقط زیرمجموعه‌های مستقیم
// ============================================================
export async function getPersonnelForSelect() {
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
//  ۳) ثبت پروژه — گارد: همه اعضا زیرمجموعه مستقیم من
// ============================================================
export async function createProjectAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const projectCode = (formData.get("projectCode") as string)?.trim();
  const projectName = (formData.get("projectName") as string)?.trim();
  const description = formData.get("description") as string;
  const startDate = formData.get("startDate") as string;
  const goldenDate = formData.get("goldenDate") as string;
  const endDate = formData.get("endDate") as string;
  const deadlineDate = formData.get("deadlineDate") as string;
  const goldenBonusPercent = parseFloat(formData.get("goldenBonusPercent") as string) || 0;
  const delayPenaltyPercent = parseFloat(formData.get("delayPenaltyPercent") as string) || 0;
  const budget = parseFloat(formData.get("budget") as string);

  const personnelIds = formData.getAll("personnelId").map((id) => parseInt(id as string)).filter((id) => !isNaN(id));
  const personnelRoles = formData.getAll("personnelRole").map((r) => r as string);
  const personnelWages = formData.getAll("personnelWage").map((w) => parseFloat(w as string) || 0);
  const projectLeaderId = formData.get("projectLeaderId") ? parseInt(formData.get("projectLeaderId") as string) : null;

  if (!projectCode) return { error: "کد پروژه الزامی است" };
  if (!projectName) return { error: "نام پروژه الزامی است" };

  const me = await getCurrentPersonnelId();
  if (!me) return { error: "نشست نامعتبر است — دوباره وارد شوید" };

  // گارد سروری: همه اعضای تیم باید زیرمجموعه مستقیم من باشند
  const allowedIds = new Set(await getDirectSubordinateIds(me));
  const invalid = personnelIds.filter((id) => !allowedIds.has(id));
  if (invalid.length > 0) {
    return { error: "فقط می‌توانید پرسنل زیرمجموعه مستقیم خود را به پروژه اضافه کنید" };
  }

  // مسئول پروژه باید جزو اعضا باشد
  if (projectLeaderId && !personnelIds.includes(projectLeaderId)) {
    return { error: "مسئول پروژه باید جزو اعضای انتخاب‌شده باشد" };
  }

  try {
    const newProject = await prisma.pR_Projects.create({
      data: {
        Project_Code: projectCode,
        Project_Name: projectName,
        Description: description,
        Start_Date: startDate ? new Date(startDate) : null,
        Golden_Date: goldenDate ? new Date(goldenDate) : null,
        End_Date: endDate ? new Date(endDate) : null,
        Deadline_Date: deadlineDate ? new Date(deadlineDate) : null,
        Golden_Bonus_Percent: goldenBonusPercent,
        Delay_Penalty_Percent: delayPenaltyPercent,
        Budget: budget || 0,
        Status: "Active",
        Manager_ID: me, // Personnel_ID صادرکننده
        Project_Leader_ID: projectLeaderId,
      },
    });

    if (personnelIds.length > 0) {
      await prisma.pR_Project_Assignments.createMany({
        data: personnelIds.map((pId, index) => ({
          Project_ID: newProject.Project_ID,
          Personnel_ID: pId,
          Assigned_From: new Date(),
          Role_In_Project: personnelRoles[index] || "عضو پروژه",
          Personnel_Wage: personnelWages[index] || 0,
          Is_Active: true,
        })),
      });
    }

    // فازها — منطق قبلی
    const phaseCount = parseInt(formData.get("phaseCount") as string) || 0;
    for (let i = 0; i < phaseCount; i++) {
      const pTitle = formData.get(`phaseTitle_${i}`) as string;
      const pStart = formData.get(`phaseStart_${i}`) as string;
      const pEnd = formData.get(`phaseEnd_${i}`) as string;
      const pLeaderId = parseInt(formData.get(`phaseLeaderId_${i}`) as string);
      const memberCount = parseInt(formData.get(`phaseMemberCount_${i}`) as string) || 0;

      if (pTitle && pStart && pEnd && pLeaderId && memberCount > 0) {
        const newPhase = await prisma.pR_Project_Phases.create({
          data: {
            Project_ID: newProject.Project_ID,
            Title: pTitle,
            Start_Date: new Date(pStart),
            End_Date: new Date(pEnd),
            Status: "Pending",
          },
        });

        const phaseAssignmentsData = [];
        for (let m = 0; m < memberCount; m++) {
          const mId = parseInt(formData.get(`phaseMember_${i}_${m}`) as string);
          if (mId) {
            phaseAssignmentsData.push({
              Phase_ID: newPhase.Phase_ID,
              Personnel_ID: mId,
              Is_Leader: mId === pLeaderId,
            });
          }
        }

        if (phaseAssignmentsData.length > 0) {
          await prisma.pR_Phase_Assignments.createMany({ data: phaseAssignmentsData });
        }
      }
    }
  } catch (error: any) {
    console.error("خطا در ثبت پروژه:", error.message);
    if (error?.code === "P2002") return { error: "کد پروژه تکراری است" };
    return { error: `خطا در ثبت پروژه: ${error.message}` };
  }

  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/my-projects");
  return { success: true };
}

// ============================================================
//  ۴) حذف — فقط ثبت‌کننده (یا CEO) + cascade کامل
// ============================================================
export async function deleteProjectAction(formData: FormData) {
  const projectId = parseInt(formData.get("projectId") as string);
  if (isNaN(projectId)) return { error: "شناسه نامعتبر است" };

  const me = await getCurrentPersonnelId();
  if (!me) return { error: "نشست نامعتبر است" };

  const project = await prisma.pR_Projects.findUnique({
    where: { Project_ID: projectId },
    select: { Manager_ID: true },
  });
  if (!project) return { error: "پروژه یافت نشد" };

  const isCEO = await isCurrentUserCEO();
  if (project.Manager_ID !== me && !isCEO) {
    return { error: "فقط صادرکننده پروژه می‌تواند آن را حذف کند" };
  }

  try {
    const phases = await prisma.pR_Project_Phases.findMany({
      where: { Project_ID: projectId },
      select: { Phase_ID: true },
    });
    const phaseIds = phases.map((p) => p.Phase_ID);

    await prisma.$transaction([
      prisma.pR_Phase_Assignments.deleteMany({ where: { Phase_ID: { in: phaseIds } } }),
      prisma.pR_Project_Phases.deleteMany({ where: { Project_ID: projectId } }),
      prisma.pR_Project_Assignments.deleteMany({ where: { Project_ID: projectId } }),
      prisma.pR_Daily_Reports.updateMany({ where: { Project_ID: projectId }, data: { Project_ID: null } }),
      prisma.pR_Projects.delete({ where: { Project_ID: projectId } }),
    ]);
  } catch (error: any) {
    console.error("خطا در حذف پروژه:", error.message);
    return { error: `خطا در حذف پروژه: ${error.message}` };
  }

  revalidatePath("/dashboard/projects");
  return { success: true };
}