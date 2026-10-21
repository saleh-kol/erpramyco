"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ۱. گرفتن لیست پرسنل همراه با اطلاعات مالی + جایگاه و واحد سازمانی
export async function getPersonnelForPayroll() {
  const personnelData = await prisma.personnel.findMany({
    where: { IsActive: true, Role: { not: 'CEO' } },
    include: {
      OrganizationalPosition: true,
      Unit: true,
      PR_Personnel_Finance_PR_Personnel_Finance_Personnel_IDToPersonnel: {
        where: { Is_Active: true },
        take: 1,
        orderBy: { Effective_From: 'desc' }
      }
    },
    orderBy: { Full_Name: "asc" }
  });

  const mappedPersonnel = personnelData.map((p: any) => ({
    ...p,
    PR_Personnel_Finance: p.PR_Personnel_Finance_PR_Personnel_Finance_Personnel_IDToPersonnel
  }));

  return JSON.parse(JSON.stringify(mappedPersonnel));
}

// ۲. ذخیره تنظیمات مالی با پارامترهای جدید
//    مزد ثابت ماهانه → مبنای روزانه = مزد ثابت ÷ ۳۰ (در فرانت محاسبه می‌شود)
export async function savePersonnelPayrollAction(formData: FormData): Promise<void> {
  const financeId = formData.get('financeId') ? parseInt(formData.get('financeId') as string) : null;
  const personnelId = parseInt(formData.get('personnelId') as string);

  const data = {
    Base_Monthly_Salary: parseFloat(formData.get('Base_Monthly_Salary') as string) || 0,
    Housing_Allowance:   parseFloat(formData.get('Housing_Allowance') as string) || 0,
    Child_Allowance:     parseFloat(formData.get('Child_Allowance') as string) || 0,
    Seniority_Daily_Base: parseFloat(formData.get('Seniority_Daily_Base') as string) || 0,
    Household_Allowance: parseFloat(formData.get('Household_Allowance') as string) || 0,
    Other_Benefits:      parseFloat(formData.get('Other_Benefits') as string) || 0,
    Holiday_Hour_Multiplier: parseFloat(formData.get('Holiday_Hour_Multiplier') as string) || 0,
    Friday_Hour_Multiplier:  parseFloat(formData.get('Friday_Hour_Multiplier') as string) || 0,
    // ضریب اضافه‌کاری (مثلاً 1.40 = +40%) — از کلاینت به‌صورت مضرب می‌آید؛ پیش‌فرض قانون کار 1.40
    Overtime_Multiplier: (() => {
      const m = parseFloat(formData.get('Overtime_Multiplier') as string);
      return m > 0 ? m : 1.40;
    })(),
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