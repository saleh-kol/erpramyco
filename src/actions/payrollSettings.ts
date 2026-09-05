"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ۱. گرفتن لیست پرسنل همراه با اطلاعات مالی
export async function getPersonnelForPayroll() {
  const personnelData = await prisma.personnel.findMany({
    where: { IsActive: true, Role: { not: 'Contractor' } },
    include: {
      PR_Personnel_Finance_PR_Personnel_Finance_Personnel_IDToPersonnel: {
        where: { Is_Active: true },
        take: 1,
        orderBy: { Effective_From: 'desc' }
      }
    },
    orderBy: { Full_Name: "asc" }
  });

  const mappedPersonnel = personnelData.map(p => ({
    ...p,
    PR_Personnel_Finance: p.PR_Personnel_Finance_PR_Personnel_Finance_Personnel_IDToPersonnel
  }));

  return JSON.parse(JSON.stringify(mappedPersonnel));
}

// ۲. ذخیره تنظیمات مالی برای یک فرد خاص
export async function savePersonnelPayrollAction(formData: FormData): Promise<void> {
  const financeId = formData.get('financeId') ? parseInt(formData.get('financeId') as string) : null;
  const personnelId = parseInt(formData.get('personnelId') as string);

  const data = {
    Base_Monthly_Salary: parseFloat(formData.get('Base_Monthly_Salary') as string) || 0,
    Base_Hourly_Rate: parseFloat(formData.get('Base_Hourly_Rate') as string) || 0,
    Holiday_Hour_Multiplier: parseFloat(formData.get('Holiday_Hour_Multiplier') as string) || 0,
    Friday_Hour_Multiplier: parseFloat(formData.get('Friday_Hour_Multiplier') as string) || 0,
    Mission_Regular_Multiplier: parseFloat(formData.get('Mission_Regular_Multiplier') as string) || 0,
    Mission_Friday_Multiplier: parseFloat(formData.get('Mission_Friday_Multiplier') as string) || 0,
    Mission_Holiday_Multiplier: parseFloat(formData.get('Mission_Holiday_Multiplier') as string) || 0,
  };

  if (financeId) {
    await prisma.pR_Personnel_Finance.update({
      where: { Finance_ID: financeId },
      data
    });
  } else {
    await prisma.pR_Personnel_Finance.create({
      data: {
        Personnel_ID: personnelId,
        Effective_From: new Date(),
        Is_Active: true,
        ...data
      }
    });
  }

  revalidatePath('/dashboard/payroll-settings');
}