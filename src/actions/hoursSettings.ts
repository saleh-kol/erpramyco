"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ۱. گرفتن لیست پرسنل همراه با اطلاعات مالی
export async function getPersonnelForHours() {
  const personnelData = await prisma.personnel.findMany({
    where: { IsActive: true },
    include: {
      // نام دقیق رابطه در پراسیما
      PR_Personnel_Finance_PR_Personnel_Finance_Personnel_IDToPersonnel: {
        where: { Is_Active: true },
        take: 1, // آخرین رکورد فعال
        orderBy: { Effective_From: 'desc' }
      }
    },
    orderBy: { Full_Name: "asc" }
  });

  // برای ساده‌سازی کدهای فرانت‌اند، نام رابطه طولانی را به PR_Personnel_Finance تبدیل می‌کنیم
  const mappedPersonnel = personnelData.map(p => ({
    ...p,
    PR_Personnel_Finance: p.PR_Personnel_Finance_PR_Personnel_Finance_Personnel_IDToPersonnel
  }));

  return JSON.parse(JSON.stringify(mappedPersonnel));
}

// ۲. ذخیره ساعات مجاز برای یک فرد خاص
export async function savePersonnelHoursAction(formData: FormData) {
  const financeId = parseInt(formData.get('financeId') as string);
  const personnelId = parseInt(formData.get('personnelId') as string);

  const fields = [
    "Week1_Max_Hours", "Week1_Max_Overtime",
    "Week2_Max_Hours", "Week2_Max_Overtime",
    "Week3_Max_Hours", "Week3_Max_Overtime",
    "Week4_Max_Hours", "Week4_Max_Overtime",
    "MonthEnd_Max_Hours", "MonthEnd_Max_Overtime",
    "Max_Friday_Hours_Month", "Max_Holiday_Hours_Month"
  ];

  const data: any = {};
  fields.forEach(f => data[f] = parseFloat(formData.get(f) as string) || 0);

  if (financeId) {
    // آپدیت رکورد موجود
    await prisma.pR_Personnel_Finance.update({
      where: { Finance_ID: financeId },
      data
    });
  } else {
    // اگر فرد فاقد رکورد مالی بود، یک رکورد جدید می‌سازیم
    await prisma.pR_Personnel_Finance.create({
      data: {
        Personnel_ID: personnelId,
        Effective_From: new Date(),
        Is_Active: true,
        ...data
      }
    });
  }

  revalidatePath('/dashboard/hours-settings');
}