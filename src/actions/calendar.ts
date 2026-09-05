"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ۱. گرفتن لیست تعطیلات
export async function getHolidays() {
  const holidays = await prisma.pR_Holidays.findMany({
    orderBy: { Date: 'asc' }
  });
  return JSON.parse(JSON.stringify(holidays));
}

// ۲. ثبت روز تعطیل جدید
export async function addHolidayAction(formData: FormData): Promise<void> {
  const dateStr = formData.get('date') as string;
  const description = formData.get('description') as string;

  if (!dateStr) return;

  try {
    await prisma.pR_Holidays.upsert({
      where: { Date: new Date(dateStr) },
      update: { Description: description },
      create: { Date: new Date(dateStr), Description: description }
    });
  } catch (error: any) {
    console.error("خطا در ثبت تعطیلی:", error.message);
  }

  revalidatePath('/dashboard/calendar');
}

// ۳. حذف روز تعطیل
export async function deleteHolidayAction(formData: FormData): Promise<void> {
  const id = parseInt(formData.get('id') as string);

  try {
    await prisma.pR_Holidays.delete({
      where: { Holiday_ID: id }
    });
  } catch (error: any) {
    console.error("خطا در حذف تعطیلی:", error.message);
  }

  revalidatePath('/dashboard/calendar');
}