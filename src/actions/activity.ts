"use server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// ۱. گرفتن فعالیت در حال انجام کاربر
export async function getMyActiveActivity() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;

  const user = await verifySession(session);
  if (!user) return null; // درست شد: null نه []

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return null;

  const activeReport = await prisma.pR_Daily_Reports.findFirst({
    where: { Personnel_ID: dbUser.Personnel_ID, Check_Out: null }
  });
  return JSON.parse(JSON.stringify(activeReport));
}

// ۲. ثبت فعالیت با ساعت ورود و خروج دستی (فقط برای امروز)
export async function createManualActivityAction(formData: FormData) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return { error: "نشست نامعتبر است" };

  const user = await verifySession(session);
  if (!user) return { error: "نشست نامعتبر است" };

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return { error: "پروفایل پرسنلی یافت نشد" };

  const category = formData.get('category') as string;
  const projectId = formData.get('projectId') ? parseInt(formData.get('projectId') as string) : null;
  const taskId = formData.get('taskId') ? parseInt(formData.get('taskId') as string) : null;
  const missionId = formData.get('missionId') ? parseInt(formData.get('missionId') as string) : null;
  const workTypeId = formData.get('workTypeId') ? parseInt(formData.get('workTypeId') as string) : null;
  const locationId = formData.get('locationId') ? parseInt(formData.get('locationId') as string) : null;
  const difficulty = parseInt(formData.get('difficulty') as string) || 1;
  const description = formData.get('description') as string;
  
  const checkInTime = formData.get('checkIn') as string;
  const checkOutTime = formData.get('checkOut') as string;

  // ساخت آبجکت تاریخ برای امروز با ساعت وارد شده
  const today = new Date();
  const checkInDate = new Date(today);
  if (checkInTime) {
    const [h, m] = checkInTime.split(':');
    checkInDate.setHours(parseInt(h), parseInt(m), 0, 0);
  }

  let checkOutDate = null;
  let workHours = 0;

  if (checkOutTime) {
    checkOutDate = new Date(today);
    const [h, m] = checkOutTime.split(':');
    checkOutDate.setHours(parseInt(h), parseInt(m), 0, 0);
    // اگر خروج قبل از ورود بود (یعنی شیفت شبانه‌روزی بوده)، یک روز به خروج اضافه کن
    if (checkOutDate < checkInDate) {
      checkOutDate.setDate(checkOutDate.getDate() + 1);
    }
    
    // --- اعتبارسنجی ساعت شروع و پایان ---
    const [outH, outM] = checkOutTime.split(':').map(Number);
    const [inH, inM] = checkInTime.split(':').map(Number);
    if (outH * 60 + outM <= inH * 60 + inM) {
      return { error: "ساعت پایان باید بعد از ساعت شروع باشد." };
    }

    // --- بررسی تداخل زمانی با فعالیت‌های قبلی امروز ---
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existingReports = await prisma.pR_Daily_Reports.findMany({
      where: {
        Personnel_ID: dbUser.Personnel_ID,
        Report_Date: { gte: todayStart, lte: todayEnd }
      }
    });

    for (const report of existingReports) {
      if (report.Check_In && report.Check_Out) {
        const existStart = new Date(report.Check_In).getTime();
        const existEnd = new Date(report.Check_Out).getTime();
        const newStart = checkInDate.getTime();
        const newEnd = checkOutDate.getTime();

        // فرمول تداخل: اگر شروع جدید قبل از پایان قدیمی باشد و پایان جدید بعد از شروع قدیمی باشد
        if (newStart < existEnd && newEnd > existStart) {
          return { error: "بازه زمانی این فعالیت با فعالیت‌های قبلی شما در امروز تداخل دارد. لطفاً زمان دیگری را انتخاب کنید." };
        }
      }
    }
    // ---------------------------------------------

    // --- محاسبه ساعت سپری شده ---
    const diffMs = checkOutDate.getTime() - checkInDate.getTime();
    workHours = diffMs / (1000 * 60 * 60); // تبدیل به ساعت اعشاری
  }

  let missionDest = null;
  if (category === 'mission' && missionId) {
    const mission = await prisma.pR_Commute_Logs.findUnique({ where: { Commute_ID: missionId }});
    missionDest = mission?.Destination || null;
  }

  try {
    await prisma.pR_Daily_Reports.create({
      data: {
        Personnel_ID: dbUser.Personnel_ID,
        Report_Date: today,
        Check_In: checkInDate,
        Check_Out: checkOutDate,
        Work_Hours: parseFloat(workHours.toFixed(2)),
        Report_Status: checkOutDate ? 'Submitted' : 'Draft',
        Work_Type_ID: workTypeId,
        Location_ID: locationId,
        Project_ID: projectId,
        Is_Mission: category === 'mission',
        Mission_Destination: missionDest,
        Work_Description: taskId ? `انجام ابلاغیه شماره ${taskId}\n${description}` : description,
        Manager_Score: 100,
        Difficulty: difficulty ? parseFloat(difficulty.toString()) : 1
      }
    });
    revalidatePath('/dashboard/attendance');
    return { success: true };
  } catch (error: any) {
    return { error: `خطا در ثبت فعالیت: ${error.message}` };
  }
}
// ۳. گرفتن گزینه‌های فرم
export async function getActivityFormOptions() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return { types: [], locations: [], projects: [], tasks: [], missions: [] };

  const user = await verifySession(session);
  if (!user) return { types: [], locations: [], projects: [], tasks: [], missions: [] }; // درست شد

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });

  const types = await prisma.pR_Work_Types.findMany({ where: { Is_Active: true } });
  const locations = await prisma.pR_Work_Locations.findMany({ where: { Is_Active: true } });
  
  let projects: any[] = [];
  let tasks: any[] = [];
  let missions: any[] = [];
  
  if (dbUser?.Personnel_ID) {
    // پروژه‌های فعال
    const assignments = await prisma.pR_Project_Assignments.findMany({
      where: { Personnel_ID: dbUser.Personnel_ID, Is_Active: true, PR_Projects: { Status: 'Active' } },
      include: { PR_Projects: true }
    });
    projects = assignments.map((a: any) => a.PR_Projects);

    // ابلاغیه‌های در انتظار انجام
    tasks = await prisma.pR_Tasks.findMany({
      where: { Assigned_To: dbUser.Personnel_ID, Status: 'Pending' }
    });

    // ماموریت‌های در حال انجام
    missions = await prisma.pR_Commute_Logs.findMany({
      where: { Personnel_ID: dbUser.Personnel_ID, Status: 'InProgress' },
      orderBy: { Commute_Date: 'desc' }
    });
  }

  return JSON.parse(JSON.stringify({ types, locations, projects, tasks, missions }));
}