"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

// ============================================================
//  ابزارها
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

/** مدیرعامل فعال (اولین) */
async function getCEO(): Promise<any | null> {
  const ceo = await prisma.personnel.findFirst({
    where: { Role: "CEO", IsActive: true },
    select: {
      Personnel_ID: true, Full_Name: true, Personal_Image_Path: true,
      OrganizationalPosition: { select: { Name: true } },
    },
  });
  return ceo ? JSON.parse(JSON.stringify(ceo)) : null;
}

// ============================================================
//  ⭐ توابع کمکی — برای ادغام صفحات بعدی (مرخصی/ماموریت/...)
// ============================================================

/** سرپرست مستقیم — null یعنی زیرمجموعه مستقیم CEO */
export async function getDirectSupervisorId(personnelId: number): Promise<number | null> {
  const rec = await prisma.pR_Supervision.findUnique({
    where: { Personnel_ID: personnelId },
    select: { Supervisor_ID: true },
  });
  return rec?.Supervisor_ID ?? null;
}

/** همه زیرمجموعه‌های مستقیم یک سرپرست */
export async function getSubordinateIds(supervisorPersonnelId: number): Promise<number[]> {
  const rows = await prisma.pR_Supervision.findMany({
    where: { Supervisor_ID: supervisorPersonnelId },
    select: { Personnel_ID: true },
  });
  return rows.map((r) => r.Personnel_ID);
}

/** آیا X در زنجیره سرپرستی Y است؟ (X رئیس Y است — مستقیم یا غیرمستقیم) */
export async function isSupervisorOf(supervisorId: number, subordinateId: number): Promise<boolean> {
  const ceo = await prisma.personnel.findFirst({ where: { Role: "CEO", IsActive: true }, select: { Personnel_ID: true } });
  let current = subordinateId;
  const visited = new Set<number>();
  while (current !== supervisorId) {
    if (visited.has(current)) return false;
    visited.add(current);
    if (ceo && current === ceo.Personnel_ID) return false; // به ریشه رسید
    const rec = await prisma.pR_Supervision.findUnique({
      where: { Personnel_ID: current },
      select: { Supervisor_ID: true },
    });
    if (!rec) return false; // زیرمجموعه مستقیم CEO است
    current = rec.Supervisor_ID;
  }
  return true;
}

// ============================================================
//  ۱) داده کامل صفحه تنظیمات (درخت + لیست)
// ============================================================
export async function getSupervisionData() {
  const ceo = await getCEO();
  const ceoId = ceo?.Personnel_ID ?? null;

  const [assignments, personnelList] = await Promise.all([
    prisma.pR_Supervision.findMany({
      include: {
        Personnel: {
          select: { Personnel_ID: true, Full_Name: true, Personal_Image_Path: true, OrganizationalPosition: { select: { Name: true } } },
        },
        Supervisor: {
          select: { Personnel_ID: true, Full_Name: true },
        },
      },
    }),
    prisma.personnel.findMany({
      where: { IsActive: true },
      select: {
        Personnel_ID: true, Full_Name: true, Personal_Image_Path: true, Role: true,
        OrganizationalPosition: { select: { Name: true } },
        Unit: { select: { Name: true } },
      },
      orderBy: { Full_Name: "asc" },
    }),
  ]);

  const assignmentMap = new Map(assignments.map((a: any) => [a.Personnel_ID, a]));
  const ceoPersonnel = personnelList.filter((p: any) => p.Role === "CEO");
  const subordinates = personnelList.filter((p: any) => p.Role !== "CEO");

  // ---------- ساخت درخت ----------
  // childrenMap: Supervisor_ID → [subordinates]
  const childrenMap = new Map<number, any[]>();
  const orphans: any[] = []; // بدون رکورد → زیرمجموعه CEO
  const subById = new Map(subordinates.map((p: any) => [p.Personnel_ID, p]));

  assignments.forEach((a: any) => {
    const person = subById.get(a.Personnel_ID);
    if (!person) return; // پرسنل غیرفعال — در درخت نمی‌آید
    const node = { ...person, supervisorName: a.Supervisor?.Full_Name || "-" };
    const list = childrenMap.get(a.Supervisor_ID) || [];
    list.push(node);
    childrenMap.set(a.Supervisor_ID, list);
  });

  subordinates.forEach((p: any) => {
    if (!assignmentMap.has(p.Personnel_ID)) {
      orphans.push({ ...p, supervisorName: "مدیرعامل" });
    }
  });

  const buildTree = (parentId: number): any[] => {
    const direct = [...(childrenMap.get(parentId) || []), ...(parentId === ceoId ? orphans : [])];
    return direct
      .map((child) => ({ ...child, children: buildTree(child.Personnel_ID) }))
      .sort((a, b) => (b.children?.length || 0) - (a.children?.length || 0) || a.Full_Name.localeCompare(b.Full_Name, "fa"));
  };

  const tree = ceoId ? buildTree(ceoId) : [];

  // ---------- آمار ----------
  const stats = {
    totalSubordinates: subordinates.length,
    assigned: assignments.filter((a: any) => subById.has(a.Personnel_ID)).length,
    directToCeo: orphans.length,
    supervisorsCount: new Set(assignments.map((a: any) => a.Supervisor_ID)).size,
  };

  // ---------- لیست تخصیص ----------
  const list = subordinates.map((p: any) => {
    const rec = assignmentMap.get(p.Personnel_ID);
    return {
      ...p,
      supervisorId: rec?.Supervisor_ID ?? null,
      supervisorName: rec?.Supervisor?.Full_Name || "مدیرعامل",
      subordinatesCount: (childrenMap.get(p.Personnel_ID) || []).length,
    };
  });

  return JSON.parse(JSON.stringify({ ceo, ceoId, tree, list, stats }));
}

// ============================================================
//  ۲) تخصیص سرپرست — 🔒 با گاردهای امنیتی
// ============================================================
export async function assignSupervisorAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  try {
    const targetId = parseInt(formData.get("personnelId") as string);
    const supervisorId = parseInt(formData.get("supervisorId") as string);

    if (isNaN(targetId) || isNaN(supervisorId)) return { error: "شناسه نامعتبر است" };
    if (targetId === supervisorId) return { error: "یک پرسنل نمی‌تواند سرپرست خودش باشد" };

    const ceo = await getCEO();
    if (!ceo) return { error: "مدیرعامل فعالی یافت نشد" };

    // 🔒 CEO هدف تخصیص نیست
    if (targetId === ceo.Personnel_ID) return { error: "برای مدیرعامل نمی‌توان سرپرست تعیین کرد" };

    // 🔒 هر دو باید فعال باشند
    const [target, supervisor] = await Promise.all([
      prisma.personnel.findUnique({ where: { Personnel_ID: targetId }, select: { Role: true, IsActive: true, Full_Name: true } }),
      prisma.personnel.findUnique({ where: { Personnel_ID: supervisorId }, select: { IsActive: true, Full_Name: true } }),
    ]);

    if (!target?.IsActive) return { error: "پرسنل موردنظر فعال نیست" };
    if (!supervisor?.IsActive) return { error: "سرپرست انتخابی فعال نیست" };

    // 🔒 چک حلقه: از سرپرست پیشنهادی به بالا می‌رویم — اگر به هدف رسیدیم = چرخه
    let current: number = supervisorId;
    const visited = new Set<number>();
    while (current !== ceo.Personnel_ID) {
      if (current === targetId) {
        return { error: `ایجاد چرخه: ${target.Full_Name} نمی‌تواند سرپرست ${supervisor.Full_Name} باشد چون در زنجیره سرپرستی او قرار دارد` };
      }
      if (visited.has(current)) break; // ایمنی
      visited.add(current);
      const rec = await prisma.pR_Supervision.findUnique({
        where: { Personnel_ID: current },
        select: { Supervisor_ID: true },
      });
      if (!rec) break; // زیرمجموعه مستقیم CEO
      current = rec.Supervisor_ID;
    }

    const personnelId = await getCurrentPersonnelId();

    // upsert — هر پرسنل فقط یک رکورد
    await prisma.pR_Supervision.upsert({
      where: { Personnel_ID: targetId },
      update: { Supervisor_ID: supervisorId, Assigned_At: new Date(), Assigned_By: personnelId },
      create: { Personnel_ID: targetId, Supervisor_ID: supervisorId, Assigned_By: personnelId },
    });

    revalidatePath("/dashboard/supervision-settings");
    return { success: true };
  } catch (error: any) {
    console.error("خطا در تخصیص سرپرست:", error.message);
    return { error: `خطا: ${error.message}` };
  }
}

// ============================================================
//  ۳) حذف سرپرست → بازگشت به زیرمجموعه مستقیم CEO
// ============================================================
export async function removeSupervisorAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  try {
    const targetId = parseInt(formData.get("personnelId") as string);
    if (isNaN(targetId)) return { error: "شناسه نامعتبر است" };

    await prisma.pR_Supervision.deleteMany({ where: { Personnel_ID: targetId } });

    revalidatePath("/dashboard/supervision-settings");
    return { success: true };
  } catch (error: any) {
    return { error: `خطا: ${error.message}` };
  }
}