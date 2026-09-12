"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

// ۱. گرفتن لیست تمام ماموریت‌ها (برای صفحه اصلی ماموریت‌ها)
export async function getMissions(status: string = 'All') {
  let whereClause: any = {};
  
  if (status && status !== 'All') {
    if (status === 'approved') {
      // برای ماموریت‌های تایید شده
      whereClause.Is_Approved = true;
    } else {
      // برای سایر وضعیت‌ها (pending یا rejected)
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

// ۳. گرفتن اطلاعات کامل یک ماموریت (برای صفحه جزئیات)
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

  // برای ساده‌سازی در فرانت‌اند، نام طولانی رابطه را به Personnel تبدیل می‌کنیم
  const mappedMission = {
    ...mission,
    Personnel: mission?.Personnel_PR_Commute_Logs_Personnel_IDToPersonnel
  };

  return JSON.parse(JSON.stringify(mappedMission));
}

// ۴. آپدیت اطلاعات ماموریت و امتیاز مدیر
export async function updateMissionAction(formData: FormData): Promise<void> {
  const commuteId = parseInt(formData.get("commuteId") as string);
  const origin = formData.get("origin") as string;
  const destination = formData.get("destination") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const managerScore = formData.get("managerScore") as string;
  const managerComment = formData.get("managerComment") as string;
  const isApproved = formData.get("isApproved") === "true";

  // گرفتن آیدی مدیر
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
    // اصلاحیه: تعیین وضعیت جدید بر اساس تایید یا رد
    const newStatus = isApproved ? "Completed" : "Rejected";

    await prisma.pR_Commute_Logs.update({
      where: { Commute_ID: commuteId },
      data: {
        Origin: origin,
        Destination: destination,
        Amount: amount || 0,
        Description: description,
        Is_Approved: isApproved,
        Status: newStatus, // <--- این خط اضافه شد تا از لیست در انتظار تایید خارج شود
        Manager_Score: managerScore ? parseFloat(managerScore) : null,
        Manager_Comment: managerComment || null,
        Manager_ID: managerId ? Number(managerId) : null,
        Approved_By: managerId ? Number(managerId) : null,
        Approved_At: new Date(),
      },
    });
  } catch (error: any) {
    console.error("خطا در ویرایش ماموریت:", error.message);
  }

  revalidatePath(`/dashboard/missions/${commuteId}`);
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

// ۶. ثبت ماموریت جدید
export async function createMissionAction(formData: FormData): Promise<void> {
  const personnelId = parseInt(formData.get("personnelId") as string);
  const origin = formData.get("origin") as string;
  const destination = formData.get("destination") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const commuteDate = formData.get("commuteDate") as string;

  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  let creatorId: number | null = null;

  if (session) {
    const user = await verifySession(session);
    if (user) {
      creatorId = user.userId;
    }
  }

  try {
    await prisma.pR_Commute_Logs.create({
      data: {
        Personnel_ID: personnelId,
        Origin: origin,
        Destination: destination,
        Amount: amount || 0,
        Description: description,
        Commute_Date: commuteDate ? new Date(commuteDate) : new Date(),
        Status: "Pending",
      },
    });
  } catch (error: any) {
    console.error("خطا در ثبت ماموریت جدید:", error.message);
  }

  revalidatePath("/dashboard/missions");
}