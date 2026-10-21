"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { MISSION_STATUS, REVIEW_ACTIONS } from "@/lib/mission/constants";
import { deleteAttachmentFile } from "@/lib/mission/attachmentServer";

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
//  ⭐ هسته منطق سرپرستی (مطابق ابلاغیه‌ها)
// ============================================================
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

async function getDirectSupervisorId(personnelId: number): Promise<number | null> {
  const rec = await prisma.pR_Supervision.findUnique({
    where: { Personnel_ID: personnelId },
    select: { Supervisor_ID: true },
  });
  return rec?.Supervisor_ID ?? null;
}

/** برای page.tsx — آیا کاربر صلاحیت بررسی/ثبت ماموریت دارد؟ */
export async function checkMissionPermissions(): Promise<{ canReview: boolean; subordinateCount: number; isCEO: boolean }> {
  const isCEO = await isCurrentUserCEO();
  const me = await getCurrentPersonnelId();
  if (!me) return { canReview: false, subordinateCount: 0, isCEO };

  const subs = await getDirectSubordinateIds(me);
  return { canReview: isCEO || subs.length > 0, subordinateCount: subs.length, isCEO };
}

// ============================================================
//  ۱) لیست ماموریت‌ها — 🔴 فیلتر سلسله‌مراتبی
//  OR: ماموریت‌هایی که من ثبت کردم OR ماموریت‌های زیرمجموعه‌هایم
// ============================================================
export async function getMissions(status: string = "All") {
  const me = await getCurrentPersonnelId();
  if (!me) return [];

  const whereClause: any = {};

  if (status && status !== "All") {
    if (status === "approved") {
      whereClause.Is_Approved = true;
    } else if (status === "inprogress") {
      whereClause.Status = MISSION_STATUS.IN_PROGRESS;
    } else if (status === "completed") {
      // کارمند تمام کرده؛ منتظر ارزیابی
      whereClause.Status = MISSION_STATUS.COMPLETED;
      whereClause.Is_Approved = false;
    } else {
      whereClause.Status = status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  const mySubIds = await getDirectSubordinateIds(me);

  // 🔒 فقط: ثبت‌شده توسط من OR مخاطب زیرمجموعه مستقیم من
  whereClause.OR = [
    { Approved_By: me },
    ...(mySubIds.length > 0 ? [{ Personnel_ID: { in: mySubIds } }] : []),
  ];

  const missions = await prisma.pR_Commute_Logs.findMany({
    where: whereClause,
    include: { Personnel_PR_Commute_Logs_Personnel_IDToPersonnel: true },
    orderBy: { Commute_Date: "desc" },
  });

  return JSON.parse(JSON.stringify(missions));
}

// ============================================================
//  ۲) پرسنل برای فرم ثبت — 🔴 فقط زیرمجموعه‌های مستقیم
// ============================================================
export async function getPersonnelForMission() {
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
//  ۳) جزئیات ماموریت — 🔒 با گارد دسترسی
//  (ثبت‌کننده یا سرپرست مخاطب یا خود مخاطب)
// ============================================================
export async function getMissionDetails(id: string) {
  const me = await getCurrentPersonnelId();
  if (!me) return null;

  const mission = await prisma.pR_Commute_Logs.findUnique({
    where: { Commute_ID: parseInt(id) },
    include: {
      Mission_Attachments: true,
      Personnel_PR_Commute_Logs_Personnel_IDToPersonnel: {
        include: { OrganizationalPosition: true, Unit: true },
      },
    },
  });

  if (!mission) return null;

  // 🔒 گارد دسترسی
  const isCEO = await isCurrentUserCEO();
  const mySubIds = new Set(await getDirectSubordinateIds(me));
  const canView =
    isCEO ||
    mission.Personnel_ID === me ||           // خود مخاطب
    mission.Approved_By === me ||            // ثبت‌کننده
    mySubIds.has(mission.Personnel_ID);      // سرپرست مخاطب

  if (!canView) return null;

  const mapped = {
    ...mission,
    Personnel: mission.Personnel_PR_Commute_Logs_Personnel_IDToPersonnel,
  };

  return JSON.parse(JSON.stringify(mapped));
}

// ============================================================
//  ۴) ویرایش + ارزیابی — 🔒 فقط سرپرست مستقیم مخاطب
//  منطق سه‌حالته دقیقاً حفظ شد
// ============================================================
export async function updateMissionAction(formData: FormData) {
  const commuteId     = parseInt(formData.get("commuteId") as string);
  const origin        = formData.get("origin") as string;
  const destination   = formData.get("destination") as string;
  const amount        = parseFloat(formData.get("amount") as string);
  const description   = formData.get("description") as string;
  const managerScore  = formData.get("managerScore") as string;
  const managerComment = formData.get("managerComment") as string;
  const reviewAction  = formData.get("reviewAction") as string;
  const receiptNumber = formData.get("receiptNumber") as string;

  if (isNaN(commuteId)) return { error: "شناسه ماموریت نامعتبر است" };

  try {
    const me = await getCurrentPersonnelId();
    if (!me) return { error: "نشست نامعتبر است" };

    const current = await prisma.pR_Commute_Logs.findUnique({
      where: { Commute_ID: commuteId },
    });
    if (!current) return { error: "ماموریت یافت نشد" };

    // 🔒 گارد: فقط سرپرست مستقیم مخاطب (یا CEO اگر مخاطب زیرمجموعه CEO است)
    const directSupervisorId = await getDirectSupervisorId(current.Personnel_ID);
    if (directSupervisorId === null) {
      const isCEO = await isCurrentUserCEO();
      if (!isCEO) return { error: "ارزیابی این ماموریت فقط توسط مدیرعامل امکان‌پذیر است" };
    } else if (directSupervisorId !== me) {
      return { error: "فقط سرپرست مستقیم کارمند می‌تواند این ماموریت را ارزیابی کند" };
    }

    const currentStatus = current.Status;
    let finalStatus = currentStatus || MISSION_STATUS.IN_PROGRESS;
    let finalIsApproved = false;

    if (reviewAction === REVIEW_ACTIONS.APPROVED) {
      if (currentStatus === MISSION_STATUS.COMPLETED) {
        finalStatus = MISSION_STATUS.COMPLETED;
        finalIsApproved = true;
      } else {
        finalStatus = MISSION_STATUS.IN_PROGRESS;
        finalIsApproved = false;
      }
    } else if (reviewAction === REVIEW_ACTIONS.REJECTED) {
      finalStatus = MISSION_STATUS.REJECTED;
      finalIsApproved = false;
    } else if (reviewAction === REVIEW_ACTIONS.NEEDS_REVISION) {
      finalStatus = MISSION_STATUS.IN_PROGRESS;
      finalIsApproved = false;
    }

    await prisma.pR_Commute_Logs.update({
      where: { Commute_ID: commuteId },
      data: {
        Origin: origin,
        Destination: destination,
        Amount: amount || 0,
        Description: description,
        Is_Approved: finalIsApproved,
        Status: finalStatus,
        Manager_Score: managerScore ? parseFloat(managerScore) : null,
        Manager_Comment: managerComment || null,
        Manager_ID: me,
        Approved_By: me,
        Approved_At: new Date(),
        Receipt_Number: receiptNumber || null,
      },
    });
  } catch (error: any) {
    console.error("خطا در ویرایش ماموریت:", error.message);
    return { error: `خطا در بروزرسانی: ${error.message}` };
  }

  revalidatePath(`/dashboard/missions/${commuteId}`);
  revalidatePath("/dashboard/missions");
  return { success: true };
}

// ============================================================
//  ۵) حذف — 🔒 فقط ثبت‌کننده یا سرپرست مخاطب
//  (پاکسازی پیوست‌ها — دست نخورده)
// ============================================================
export async function deleteMissionAction(formData: FormData) {
  const commuteId = parseInt(formData.get("commuteId") as string);
  if (isNaN(commuteId)) return { error: "شناسه ماموریت نامعتبر است" };

  try {
    const me = await getCurrentPersonnelId();
    if (!me) return { error: "نشست نامعتبر است" };

    const mission = await prisma.pR_Commute_Logs.findUnique({
      where: { Commute_ID: commuteId },
    });
    if (!mission) return { error: "ماموریت یافت نشد" };

    // 🔒 گارد: ثبت‌کننده یا سرپرست مخاطب (یا CEO)
    const isCEO = await isCurrentUserCEO();
    const mySubIds = new Set(await getDirectSubordinateIds(me));
    const canDelete = isCEO || mission.Approved_By === me || mySubIds.has(mission.Personnel_ID);
    if (!canDelete) return { error: "دسترسی به حذف این ماموریت را ندارید" };

    const attachments = await prisma.pR_Mission_Attachments.findMany({
      where: { Commute_ID: commuteId },
    });

    for (const att of attachments) {
      await deleteAttachmentFile(att.File_Path);
    }

    if (attachments.length > 0) {
      await prisma.pR_Mission_Attachments.deleteMany({
        where: { Commute_ID: commuteId },
      });
    }

    await prisma.pR_Commute_Logs.delete({ where: { Commute_ID: commuteId } });
  } catch (error: any) {
    console.error("خطا در حذف ماموریت:", error.message);
    return { error: `خطا در حذف ماموریت: ${error.message}` };
  }

  revalidatePath("/dashboard/missions");
  return { success: true };
}

// ============================================================
//  ۶) ثبت مستقیم — 🔒 فقط برای زیرمجموعه مستقیم
// ============================================================
export async function createMissionAction(formData: FormData) {
  const personnelId     = parseInt(formData.get("personnelId") as string);
  const origin          = formData.get("origin") as string;
  const destination     = formData.get("destination") as string;
  const commuteType     = formData.get("commuteType") as string;
  const amount          = parseFloat(formData.get("amount") as string);
  const distanceKm      = parseFloat(formData.get("distanceKm") as string);
  const receiptNumber   = formData.get("receiptNumber") as string;
  const description     = formData.get("description") as string;
  const commuteDate     = formData.get("commuteDate") as string;
  const commuteDuration = formData.get("commuteDuration") as string;

  if (isNaN(personnelId)) {
    return { error: "لطفاً یک پرسنل معتبر از لیست انتخاب کنید." };
  }

  try {
    const me = await getCurrentPersonnelId();
    if (!me) return { error: "نشست نامعتبر است" };

    // 🔒 گارد سروری: فقط زیرمجموعه مستقیم من
    const mySubIds = new Set(await getDirectSubordinateIds(me));
    if (!mySubIds.has(personnelId)) {
      return { error: "فقط می‌توانید برای زیرمجموعه‌های مستقیم خود ماموریت ثبت کنید" };
    }

    await prisma.pR_Commute_Logs.create({
      data: {
        Personnel_ID: personnelId,
        Origin: origin,
        Destination: destination,
        Commute_Type: commuteType as any,
        Distance_KM: distanceKm || 0,
        Amount: amount || 0,
        Receipt_Number: receiptNumber,
        Description: description,
        Commute_Date: commuteDate ? new Date(commuteDate) : new Date(),
        Commute_Duration: commuteDuration ? parseFloat(commuteDuration) : null,
        Status: MISSION_STATUS.IN_PROGRESS,
        Is_Approved: false,
        Approved_At: new Date(),
        Approved_By: me,
      },
    });

    revalidatePath("/dashboard/missions");
    revalidatePath("/dashboard/my-missions");
    return { success: true };
  } catch (error: any) {
    console.error("خطا در ثبت ماموریت جدید:", error.message);
    return { error: `خطا در ثبت ماموریت: ${error.message}` };
  }
}