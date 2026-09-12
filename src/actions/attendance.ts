"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

// ۱. گرفتن وضعیت امروز کاربر فعلی
export async function getMyTodayAttendance() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;

  const user = await verifySession(session); 
  if (!user) return []; 
  
  // پیدا کردن Personnel_ID از روی User_ID
  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const report = await prisma.pR_Daily_Reports.findFirst({
    where: {
      Personnel_ID: dbUser.Personnel_ID,
      Report_Date: { gte: today }
    }
  });
  return JSON.parse(JSON.stringify(report));
}

// ۲. ثبت ورود
export async function checkInAction(formData: FormData): Promise<void> {
  const userId = parseInt(formData.get('personnelId') as string); // این در واقع User_ID است
  
  // پیدا کردن Personnel_ID کاربر
  const dbUser = await prisma.users.findUnique({ where: { User_ID: userId } });
  if (!dbUser || !dbUser.Personnel_ID) throw new Error("پروفایل پرسنلی برای این کاربر یافت نشد.");
  
  const personnelId = dbUser.Personnel_ID;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // بررسی اینکه آیا امروز قبلا ورود ثبت شده یا خیر
  const existing = await prisma.pR_Daily_Reports.findFirst({
    where: { Personnel_ID: personnelId, Report_Date: { gte: today } }
  });

  if (!existing) {
    await prisma.pR_Daily_Reports.create({
      data: {
        Personnel_ID: personnelId,
        Report_Date: new Date(),
        Check_In: new Date(),
        Report_Status: 'Submitted'
      }
    });
  } else if (!existing.Check_In) {
    await prisma.pR_Daily_Reports.update({
      where: { Report_ID: existing.Report_ID },
      data: { Check_In: new Date() }
    });
  }

  revalidatePath('/dashboard/attendance');
}

// ۳. ثبت خروج
export async function checkOutAction(formData: FormData): Promise<void> {
  const reportId = parseInt(formData.get('reportId') as string);
  
  await prisma.pR_Daily_Reports.update({
    where: { Report_ID: reportId },
    data: { 
      Check_Out: new Date(),
    }
  });

  revalidatePath('/dashboard/attendance');
}

// ۴. گرفتن لیست پرسنل برای مدیر
export async function getPersonnelForAttendance() {
  const personnel = await prisma.personnel.findMany({
    // اصلاح شد: Contractor حذف و CEO قرار داده شد
    where: { IsActive: true, Role: { not: 'CEO' } },
    select: { Personnel_ID: true, Full_Name: true, Personnel_Code: true, Role: true, Personal_Image_Path: true }
  });
  return JSON.parse(JSON.stringify(personnel));
}

// ۵. گرفتن تاریخچه حضور غیاب یک فرد خاص (برای مدیر)
export async function getPersonnelAttendanceHistory(personnelId: string) {
  const reports = await prisma.pR_Daily_Reports.findMany({
    where: { Personnel_ID: parseInt(personnelId) },
    orderBy: { Report_Date: 'desc' },
    take: 30
  });
  return JSON.parse(JSON.stringify(reports));
}