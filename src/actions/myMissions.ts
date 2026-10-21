"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { MISSION_STATUS, MY_STATUS_MAP } from "@/lib/mission/constants";
import { validateAttachmentFile, saveAttachmentFile, deleteAttachmentFile } from "@/lib/mission/attachmentServer";

// ============================================================
//  ابزارهای احراز هویت
// ============================================================

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return await verifySession(token);
}

/** User_ID نشست → Personnel_ID (الگوی واحد برای همه اکشن‌ها) */
async function getCurrentPersonnelId(): Promise<number | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  return dbUser?.Personnel_ID ?? null;
}

// ============================================================
//  ۱) ماموریت‌های من (نمای کارمند)
// ============================================================
export async function getMyMissions(status: string = "pending") {
  const personnelId = await getCurrentPersonnelId();
  if (!personnelId) return [];

  const missions = await prisma.pR_Commute_Logs.findMany({
    where: {
      Personnel_ID: personnelId,
      Status: MY_STATUS_MAP[status] || MISSION_STATUS.PENDING,
    },
    include: { Mission_Attachments: true },
    orderBy: { Commute_Date: "desc" },
  });

  return JSON.parse(JSON.stringify(missions));
}

// ============================================================
//  ۲) ثبت درخواست ماموریت (کارمند → Pending)
// ============================================================
export async function createMyMissionAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "نشست نامعتبر است" };

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return { error: "پروفایل پرسنلی یافت نشد" };

  const commuteDate     = formData.get("commuteDate") as string;
  const commuteType     = formData.get("commuteType") as string;
  const origin          = formData.get("origin") as string;
  const destination     = formData.get("destination") as string;
  const distanceKm      = parseFloat(formData.get("distanceKm") as string);
  const amount          = parseFloat(formData.get("amount") as string);
  const commuteDuration = formData.get("commuteDuration") as string;
  const receiptNumber   = formData.get("receiptNumber") as string;
  const description     = formData.get("description") as string;
  const missionReport   = formData.get("missionReport") as string; // ✅ 

  try {
    await prisma.pR_Commute_Logs.create({
      data: {
        Personnel_ID: dbUser.Personnel_ID,
        // 🔧 فیکس باگ ۴: جلوگیری از Invalid Date وقتی تاریخی انتخاب نشده
        Commute_Date: commuteDate ? new Date(commuteDate) : new Date(),
        Commute_Type: commuteType as any,
        Origin: origin,
        Destination: destination,
        Distance_KM: distanceKm || 0,
        Amount: amount || 0,
        Commute_Duration: commuteDuration ? parseFloat(commuteDuration) : null,
        Receipt_Number: receiptNumber,
        Description: description,
        Mission_Report: missionReport?.trim() || null, // ✅ 
        Is_Approved: false,
        Status: MISSION_STATUS.PENDING, // کارمند ثبت می‌کند → در انتظار تایید مدیر
      },
    });

    revalidatePath("/dashboard/my-missions");
    return { success: true };
  } catch (error: any) {
    return { error: `خطا در ثبت ماموریت: ${error.message}` };
  }
}

// ============================================================
//  ۳) اتمام ماموریت (کارمند: InProgress → Completed)
// ============================================================
export async function completeMyMissionAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "نشست نامعتبر است" };

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return { error: "پروفایل پرسنلی یافت نشد" };

  const commuteId = parseInt(formData.get("commuteId") as string);
  if (isNaN(commuteId)) return { error: "شناسه ماموریت نامعتبر است" };

  // 🔧 فیکس باگ ۳: بررسی مالکیت + وضعیت (جریان UI را نمی‌شکند چون دکمه فقط برای InProgress نمایش داده می‌شود)
  const mission = await prisma.pR_Commute_Logs.findUnique({ where: { Commute_ID: commuteId } });
  if (!mission) return { error: "ماموریت یافت نشد" };
  if (mission.Personnel_ID !== dbUser.Personnel_ID)
    return { error: "این ماموریت متعلق به شما نیست" };
  if (mission.Status !== MISSION_STATUS.IN_PROGRESS)
    return { error: "فقط ماموریت‌های در حال انجام قابل اتمام هستند" };

  await prisma.pR_Commute_Logs.update({
    where: { Commute_ID: commuteId },
    data: { Status: MISSION_STATUS.COMPLETED },
  });

  revalidatePath("/dashboard/my-missions");
  return { success: true };
}

// ============================================================
//  ۴) بررسی درخواست توسط سرپرست (Pending → InProgress / Rejected)
//  🔴 فقط سرپرست مستقیم مخاطب ماموریت
// ============================================================
export async function reviewMissionRequestAction(formData: FormData) {
  const commuteId = parseInt(formData.get("commuteId") as string);
  const action = formData.get("action") as string;

  if (isNaN(commuteId)) return { error: "شناسه ماموریت نامعتبر است" };
  if (action !== "approve" && action !== "reject") return { error: "عملیات نامعتبر است" };

  const user = await getSessionUser();
  if (!user) return { error: "نشست نامعتبر است" };

  const approver = await prisma.users.findUnique({
    where: { User_ID: user.userId },
    select: { Personnel_ID: true },
  });
  if (!approver?.Personnel_ID) return { error: "پروفایل پرسنلی یافت نشد" };

  const mission = await prisma.pR_Commute_Logs.findUnique({
    where: { Commute_ID: commuteId },
  });
  if (!mission) return { error: "ماموریت یافت نشد" };
  if (mission.Status !== MISSION_STATUS.PENDING)
    return { error: "فقط درخواست‌های در انتظار تایید قابل بررسی هستند" };

  // 🔴 گارد: فقط سرپرست مستقیم مخاطب
  const supRec = await prisma.pR_Supervision.findUnique({
    where: { Personnel_ID: mission.Personnel_ID },
    select: { Supervisor_ID: true },
  });

  if (supRec) {
    // مخاطب سرپرست دارد → فقط همان نفر
    if (supRec.Supervisor_ID !== approver.Personnel_ID) {
      return { error: "فقط سرپرست مستقیم کارمند می‌تواند این درخواست را بررسی کند" };
    }
  } else {
    // مخاطب زیرمجموعه مستقیم CEO است → فقط CEO
    const dbUser = await prisma.users.findUnique({
      where: { User_ID: user.userId },
      include: { Personnel: { select: { Role: true } } },
    });
    if (dbUser?.Personnel?.Role !== "CEO") {
      return { error: "بررسی این درخواست فقط توسط مدیرعامل امکان‌پذیر است" };
    }
  }

  const newStatus =
    action === "approve" ? MISSION_STATUS.IN_PROGRESS : MISSION_STATUS.REJECTED;

  await prisma.pR_Commute_Logs.update({
    where: { Commute_ID: commuteId },
    data: {
      Status: newStatus,
      Approved_At: new Date(),
      Approved_By: approver.Personnel_ID,
    },
  });

  revalidatePath("/dashboard/missions");
  revalidatePath("/dashboard/my-missions");
  return { success: true };
}

// ============================================================
//  ۵) درخواست‌های در انتظار تایید (نمای مدیر) — 🔴 فیلتر سلسله‌مراتبی
//  Pending هایی که مخاطبشان زیرمجموعه مستقیم من است
//  (برای CEO: درخواست کارکنانِ بدون رکورد سرپرستی)
// ============================================================
export async function getPendingMissions() {
  const user = await getSessionUser();
  if (!user) return [];

  const dbUser = await prisma.users.findUnique({
    where: { User_ID: user.userId },
    include: { Personnel: { select: { Personnel_ID: true, Role: true } } },
  });
  if (!dbUser?.Personnel_ID || !dbUser.Personnel) return [];

  const me = dbUser.Personnel_ID;

  // زیرمجموعه‌های مستقیم من
  let eligibleIds: number[];
  if (dbUser.Personnel.Role === "CEO") {
    const assigned = await prisma.pR_Supervision.findMany({ select: { Personnel_ID: true } });
    const assignedSet = new Set(assigned.map((a) => a.Personnel_ID));
    const candidates = await prisma.personnel.findMany({
      where: { IsActive: true, Role: { not: "CEO" } },
      select: { Personnel_ID: true },
    });
    eligibleIds = candidates.filter((c) => !assignedSet.has(c.Personnel_ID)).map((c) => c.Personnel_ID);
  } else {
    const rows = await prisma.pR_Supervision.findMany({
      where: { Supervisor_ID: me },
      include: { Personnel: { select: { IsActive: true } } },
    });
    eligibleIds = rows.filter((r) => r.Personnel?.IsActive).map((r) => r.Personnel_ID);
  }

  if (eligibleIds.length === 0) return [];

  const missions = await prisma.pR_Commute_Logs.findMany({
    where: {
      Status: MISSION_STATUS.PENDING,
      Personnel_ID: { in: eligibleIds }, // 🔒 فقط زیرمجموعه‌های مستقیم
    },
    include: { Personnel_PR_Commute_Logs_Personnel_IDToPersonnel: true },
    orderBy: { Commute_Date: "desc" },
  });

  const mapped = missions.map((m: any) => ({
    ...m,
    Personnel: m.Personnel_PR_Commute_Logs_Personnel_IDToPersonnel,
  }));

  return JSON.parse(JSON.stringify(mapped));
}

// ============================================================
//  ۶) ثبت/ویرایش یادداشت کارمند برای مدیر (گزارش ماموریت)
// ============================================================
export async function saveMissionReportAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "نشست نامعتبر است" };

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return { error: "پروفایل پرسنلی یافت نشد" };

  const commuteId = parseInt(formData.get("commuteId") as string);
  const missionReport = (formData.get("missionReport") as string)?.trim() || null;

  if (isNaN(commuteId)) return { error: "شناسه ماموریت نامعتبر است" };
  if (!missionReport) return { error: "متن یادداشت نمی‌تواند خالی باشد" };

  const mission = await prisma.pR_Commute_Logs.findUnique({ where: { Commute_ID: commuteId } });
  if (!mission) return { error: "ماموریت یافت نشد" };

  // 🔒 گارد مالکیت — مثل completeMyMissionAction
  if (mission.Personnel_ID !== dbUser.Personnel_ID)
    return { error: "این ماموریت متعلق به شما نیست" };

  // 🔒 گارد وضعیت — فقط قبل از اتمام قابل ثبت است
  if (mission.Status !== MISSION_STATUS.PENDING && mission.Status !== MISSION_STATUS.IN_PROGRESS)
    return { error: "امکان ثبت یادداشت در این وضعیت وجود ندارد" };

  await prisma.pR_Commute_Logs.update({
    where: { Commute_ID: commuteId },
    data: { Mission_Report: missionReport },
  });

  revalidatePath("/dashboard/my-missions");
  return { success: true };
}

// ============================================================
//  ۷) آپلود پیوست برای ماموریت (کارمند)
// ============================================================
export async function uploadMissionAttachmentAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "نشست نامعتبر است" };

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return { error: "پروفایل پرسنلی یافت نشد" };

  const commuteId = parseInt(formData.get("commuteId") as string);
  if (isNaN(commuteId)) return { error: "شناسه ماموریت نامعتبر است" };

  const mission = await prisma.pR_Commute_Logs.findUnique({ where: { Commute_ID: commuteId } });
  if (!mission) return { error: "ماموریت یافت نشد" };

  // 🔒 گارد مالکیت
  if (mission.Personnel_ID !== dbUser.Personnel_ID)
    return { error: "این ماموریت متعلق به شما نیست" };

  // 🔒 گارد وضعیت — هماهنگ با قاعده یادداشت
  if (mission.Status !== MISSION_STATUS.PENDING && mission.Status !== MISSION_STATUS.IN_PROGRESS)
    return { error: "در این وضعیت امکان افزودن پیوست وجود ندارد" };

  const file = formData.get("attachment");
  if (!(file instanceof File) || file.size === 0)
    return { error: "لطفاً یک فایل انتخاب کنید" };

  const validationError = validateAttachmentFile(file);
  if (validationError) return { error: validationError };

  const saved = await saveAttachmentFile(file, commuteId);
  if ("error" in saved) return { error: saved.error };

  const attachment = await prisma.pR_Mission_Attachments.create({
    data: {
      Commute_ID: commuteId,
      File_Name: file.name,
      File_Path: saved.savedPath,
      File_Size: file.size,
      File_Type: file.type || null,
    },
  });

  revalidatePath("/dashboard/my-missions");
  return {
    success: true,
    attachment: JSON.parse(JSON.stringify(attachment)), // برای آپدیت فوری UI
  };
}

// ============================================================
//  ۸) حذف پیوست (کارمند — فقط مالک)
// ============================================================
export async function deleteMissionAttachmentAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "نشست نامعتبر است" };

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return { error: "پروفایل پرسنلی یافت نشد" };

  const attachmentId = parseInt(formData.get("attachmentId") as string);
  if (isNaN(attachmentId)) return { error: "شناسه پیوست نامعتبر است" };

  const attachment = await prisma.pR_Mission_Attachments.findUnique({
    where: { Attachment_ID: attachmentId },
    include: { PR_Commute_Logs: true },
  });
  if (!attachment) return { error: "پیوست یافت نشد" };

  // 🔒 گارد مالکیت
  if (attachment.PR_Commute_Logs.Personnel_ID !== dbUser.Personnel_ID)
    return { error: "این پیوست متعلق به شما نیست" };

  const status = attachment.PR_Commute_Logs.Status;
  if (status !== MISSION_STATUS.PENDING && status !== MISSION_STATUS.IN_PROGRESS)
    return { error: "در این وضعیت امکان حذف پیوست وجود ندارد" };

  await deleteAttachmentFile(attachment.File_Path); // اول فایل از دیسک
  await prisma.pR_Mission_Attachments.delete({ where: { Attachment_ID: attachmentId } });

  revalidatePath("/dashboard/my-missions");
  return { success: true };
}