"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

// ۱. گرفتن لیست تمام ماموریت‌ها (اصلاح شد: اضافه شدن completed)
export async function getMissions(status: string = 'All') {
  let whereClause: any = {};
  
  if (status && status !== 'All') {
    if (status === 'approved') {
      // ماموریت‌هایی که مدیر ضریب داده و تایید نهایی کرده
      whereClause.Is_Approved = true;
    } else if (status === 'inprogress') {
      // ماموریت‌های در حال انجام
      whereClause.Status = 'InProgress';
    } else if (status === 'completed') {
      // ماموریت‌هایی که کارمند تمام کرده ولی هنوز مدیر ضریب نداده
      whereClause.Status = 'Completed';
      whereClause.Is_Approved = false; 
    } else {
      const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
      whereClause.Status = formattedStatus;
    }
  }

  const missions = await prisma.pR_Commute_Logs.findMany({
    where: whereClause,
    include: {
      Personnel_PR_Commute_Logs_Personnel_IDToPersonnel: true
    },
    orderBy: { Commute_Date: 'desc' }
  });

  return JSON.parse(JSON.stringify(missions));
}

// ۲. گرفتن لیست پرسنل برای انتخاب در فرم ماموریت
export async function getPersonnelForMission() {
  const personnel = await prisma.personnel.findMany({
    where: { IsActive: true },
    select: {
      Personnel_ID: true,
      Full_Name: true,
      Personnel_Code: true,
      Role: true,
      Personal_Image_Path: true,
      OrganizationalPosition: true,
      Unit: true,
    },
  });

  return JSON.parse(JSON.stringify(personnel));
}

// ۳. گرفتن اطلاعات کامل یک ماموریت
export async function getMissionDetails(id: string) {
  const mission = await prisma.pR_Commute_Logs.findUnique({
    where: { Commute_ID: parseInt(id) },
    include: {
      Personnel_PR_Commute_Logs_Personnel_IDToPersonnel: {
        include: {
          OrganizationalPosition: true,
          Unit: true
        }
      }
    }
  });

  const mappedMission = {
    ...mission,
    Personnel: mission?.Personnel_PR_Commute_Logs_Personnel_IDToPersonnel
  };

  return JSON.parse(JSON.stringify(mappedMission));
}

// ۴. آپدیت اطلاعات ماموریت و ارزیابی نهایی مدیر (اصلاح شد: منطق تایید، رد و نیاز به بازنگری)
export async function updateMissionAction(formData: FormData) {
  const commuteId = parseInt(formData.get("commuteId") as string);
  const origin = formData.get("origin") as string;
  const destination = formData.get("destination") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const managerScore = formData.get("managerScore") as string;
  const managerComment = formData.get("managerComment") as string;
  const reviewAction = formData.get("reviewAction") as string; // 'Approved', 'Rejected', 'NeedsRevision'
  const receiptNumber = formData.get("receiptNumber") as string;

  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  let managerId: number | null = null;

  if (session) {
    const user = await verifySession(session);
    if (user) {
      managerId = user.userId;
    }
  }

  try {
    // دریافت وضعیت فعلی ماموریت برای تعیین وضعیت نهایی
    const currentMission = await prisma.pR_Commute_Logs.findUnique({ where: { Commute_ID: commuteId } });
    const currentStatus = currentMission?.Status;

    let finalStatus = currentStatus || 'InProgress';
    let finalIsApproved = false;

    if (reviewAction === 'Approved') {
      if (currentStatus === 'Completed') {
        // اگر کارمند تمام کرده بود و در مرحله تایید مدیر بود -> تایید نهایی
        finalStatus = 'Completed';
        finalIsApproved = true;
      } else {
        // در سایر حالات (مثلا Pending) تایید به معنای شروع/ادامه ماموریت است
        finalStatus = 'InProgress';
        finalIsApproved = false;
      }
    } else if (reviewAction === 'Rejected') {
      finalStatus = 'Rejected';
      finalIsApproved = false;
    } else if (reviewAction === 'NeedsRevision') {
      // نیاز به بازنگری -> بازگشت به در حال انجام
      finalStatus = 'InProgress';
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
        Manager_ID: managerId ? Number(managerId) : null,
        Approved_By: managerId ? Number(managerId) : null,
        Approved_At: new Date(),
        Receipt_Number: receiptNumber || null,
      },
    });
  } catch (error: any) {
    console.error("خطا در ویرایش ماموریت:", error.message);
    return { error: `خطا در بروزرسانی: ${error.message}` };
  }

  revalidatePath(`/dashboard/missions/${commuteId}`);
  return { success: true };
}

// ۵. حذف ماموریت
export async function deleteMissionAction(formData: FormData) {
  const commuteId = parseInt(formData.get("commuteId") as string);

  try {
    await prisma.pR_Commute_Logs.delete({
      where: { Commute_ID: commuteId },
    });
  } catch (error: any) {
    console.error("خطا در حذف ماموریت:", error.message);
    return { error: `خطا در حذف ماموریت: ${error.message}` };
  }

  revalidatePath("/dashboard/missions");
  return { success: true };
}

// ۶. ثبت ماموریت جدید توسط مدیر (مستقیم به InProgress می‌رود)
export async function createMissionAction(formData: FormData) {
  const personnelId = parseInt(formData.get("personnelId") as string);
  const origin = formData.get("origin") as string;
  const destination = formData.get("destination") as string;
  const commuteType = formData.get("commuteType") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const distanceKm = parseFloat(formData.get("distanceKm") as string);
  const receiptNumber = formData.get("receiptNumber") as string;
  const description = formData.get("description") as string;
  const commuteDate = formData.get("commuteDate") as string;
  const commuteDuration = formData.get("commuteDuration") as string;

  if (isNaN(personnelId)) {
    return { error: "لطفاً یک پرسنل معتبر از لیست انتخاب کنید." };
  }

  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  let managerId: number | null = null;

  if (session) {
    const user = await verifySession(session);
    if (user) {
      managerId = user.userId;
    }
  }

  try {
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
        // مدیر ثبت می‌کند → مستقیم در حال انجام
        Status: "InProgress",
        // Is_Approved باید false باشد چون هنوز ارزیابی نهایی نشده
        Is_Approved: false, 
        Approved_By: managerId,
        Approved_At: new Date(),
      },
    });
    return { success: true };
  } catch (error: any) {
    console.error("خطا در ثبت ماموریت جدید:", error.message);
    return { error: `خطا در ثبت ماموریت: ${error.message}` };
  }

  revalidatePath("/dashboard/missions");
}