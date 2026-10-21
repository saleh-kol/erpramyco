"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { startOfMonth } from "date-fns-jalali";

const HOUR_FIELDS = [
  "Week1_Max_Hours", "Week1_Max_Overtime",
  "Week2_Max_Hours", "Week2_Max_Overtime",
  "Week3_Max_Hours", "Week3_Max_Overtime",
  "Week4_Max_Hours", "Week4_Max_Overtime",
  "MonthEnd_Max_Hours", "MonthEnd_Max_Overtime",
  "Max_Friday_Hours_Month", "Max_Holiday_Hours_Month",
] as const;

export async function getPersonnelForHours() {
  const personnelData = await prisma.personnel.findMany({
    where: { IsActive: true },
    include: {
      OrganizationalPosition: true,
      Unit: true,
      PR_Personnel_Finance_PR_Personnel_Finance_Personnel_IDToPersonnel: {
        where: { Is_Active: true },
        take: 1,
        orderBy: { Effective_From: "desc" },
      },
    },
    orderBy: { Full_Name: "asc" },
  });

  const mappedPersonnel = personnelData.map((p: any) => ({
    ...p,
    PR_Personnel_Finance: p.PR_Personnel_Finance_PR_Personnel_Finance_Personnel_IDToPersonnel,
  }));

  return JSON.parse(JSON.stringify(mappedPersonnel));
}

export async function savePersonnelHoursAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  try {
    const personnelId = parseInt(formData.get("personnelId") as string);
    if (isNaN(personnelId)) {
      return { error: "پرسنل نامعتبر است — صفحه را رفرش کنید و دوباره تلاش کنید" };
    }

    const data: any = {};
    for (const f of HOUR_FIELDS) {
      const raw = formData.get(f);
      const num = parseFloat((raw as string) ?? "");
      if (raw === null || (raw as string).trim() === "" || isNaN(num) || num < 0) {
        return { error: `مقدار «${f}» نامعتبر است — عدد مثبت وارد کنید` };
      }
      data[f] = num;
    }

    // جستجوی رکورد مالی سمت سرور
    const financeIdRaw = parseInt(formData.get("financeId") as string);
    let finance: any = null;

    if (!isNaN(financeIdRaw)) {
      const found = await prisma.pR_Personnel_Finance.findUnique({
        where: { Finance_ID: financeIdRaw },
      });
      if (found && found.Personnel_ID === personnelId) finance = found;
    }

    if (!finance) {
      finance = await prisma.pR_Personnel_Finance.findFirst({
        where: { Personnel_ID: personnelId, Is_Active: true },
        orderBy: { Effective_From: "desc" },
      });
    }

    if (finance) {
      await prisma.pR_Personnel_Finance.update({
        where: { Finance_ID: finance.Finance_ID },
        data,
      });
    } else {
      const effectiveFrom = startOfMonth(new Date());
      effectiveFrom.setHours(0, 0, 0, 0);

      const baseData = {
        Personnel_ID: personnelId,
        Effective_From: effectiveFrom,
        Is_Active: true,
        Currency: "IRR",
        Base_Hourly_Rate: 0,
        Overtime_Multiplier: 1.4,
        OffHours_Multiplier: 1.8,
        Min_Weekly_Hours: 44,
        Max_Weekly_Overtime: 20,
        Base_Monthly_Salary: 0,
        Housing_Allowance: 0,
        Food_Allowance: 0,
        Child_Allowance: 0,
        ...data,
      };

      try {
        // مسیر اصلی: بدون ضریب‌ها → null → ارث‌بری زنده از تنظیمات کلی
        await prisma.pR_Personnel_Finance.create({ data: baseData });
      } catch (e: any) {
        // 🔧 P2011 = قید NULL: دیتابیس هنوز sync نشده
        // → یک بار با مقادیر ارث‌بری‌شده از تنظیمات کلی تلاش می‌کنیم
        if (e?.code === "P2011") {
          const settings = await prisma.pR_Payroll_Settings.findFirst();
          await prisma.pR_Personnel_Finance.create({
            data: {
              ...baseData,
              Holiday_Hour_Multiplier:   settings?.Holiday_Hour_Multiplier   ?? 0,
              Friday_Hour_Multiplier:    settings?.Friday_Hour_Multiplier    ?? 0,
              Mission_Regular_Multiplier: settings?.Mission_Regular_Multiplier ?? 0,
              Mission_Friday_Multiplier: settings?.Mission_Friday_Multiplier ?? 0,
              Mission_Holiday_Multiplier: settings?.Mission_Holiday_Multiplier ?? 0,
              Commute_Amount: 0,
              Mission_Daily_Amount: 0,
            },
          });
        } else {
          throw e;
        }
      }
    }

    revalidatePath("/dashboard/hours-settings");
    return { success: true };
  } catch (error: any) {
    console.error("خطا در ذخیره ساعات کاری:", error.message);

    if (error?.code === "P2002") {
      try {
        const personnelId = parseInt(formData.get("personnelId") as string);
        const existing = await prisma.pR_Personnel_Finance.findFirst({
          where: { Personnel_ID: personnelId },
          orderBy: { Effective_From: "desc" },
        });
        if (existing) {
          const data: any = {};
          for (const f of HOUR_FIELDS) data[f] = parseFloat(formData.get(f) as string) || 0;
          await prisma.pR_Personnel_Finance.update({
            where: { Finance_ID: existing.Finance_ID },
            data,
          });
          revalidatePath("/dashboard/hours-settings");
          return { success: true };
        }
      } catch {
        /* پایین هندل می‌شود */
      }
      return { error: "رکورد مالی تکراری یافت شد — صفحه را رفرش و دوباره ذخیره کنید" };
    }

    return { error: `خطا در ذخیره: ${error.message}` };
  }
}