"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { startOfMonth, endOfMonth, subMonths, getDate } from "date-fns-jalali";

// تابع کمکی برای خواندن سشن امن (دست نخورده)
async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return await verifySession(token);
}

// ✅ ثابت مشترک — یک منبع حقیقت برای سقف ماهانه
const MAX_MONTHLY_HOURS = 192;

// ============================================================
//  ۱. داده‌های داشبورد کارمند
// ============================================================
export async function getEmployeeDashboardData() {
  const user = await getSession();
  if (!user) return null;

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return null;

  const personnelId = dbUser.Personnel_ID;
  const now = new Date();

  // ✅ فیکس باگ ۱: اول ماه «شمسی» — دقیق و بدون فیلتر دستی بعدی
  const monthStart = startOfMonth(now);
  monthStart.setHours(0, 0, 0, 0);

  // ✅ فیکس باگ ۷: موازی‌سازی همه کوئری‌ها
  const [pendingTasks, pendingTasksCount, activeProjects, activeProjectsCount, recentMissions, monthReports] =
    await Promise.all([
      prisma.pR_Tasks.findMany({
        where: { Assigned_To: personnelId, Status: "Pending" },
        orderBy: { Created_At: "desc" },
        take: 3,
      }),
      // ✅ فیکس باگ ۳: شمارش واقعی — نه length آرایه take:3
      prisma.pR_Tasks.count({ where: { Assigned_To: personnelId, Status: "Pending" } }),
      prisma.pR_Project_Assignments.findMany({
        where: { Personnel_ID: personnelId, Is_Active: true, PR_Projects: { Status: "Active" } },
        include: { PR_Projects: true },
        orderBy: { Created_At: "desc" },
        take: 3,
      }),
      prisma.pR_Project_Assignments.count({
        where: { Personnel_ID: personnelId, Is_Active: true, PR_Projects: { Status: "Active" } },
      }),
      prisma.pR_Commute_Logs.findMany({
        where: { Personnel_ID: personnelId, Status: { in: ["Pending", "InProgress"] } },
        orderBy: [{ Commute_Date: "desc" }, { Commute_ID: "desc" }],
        take: 3,
      }),
      // ✅ فقط فیلدهای لازم — کوئری سبک‌تر
      prisma.pR_Daily_Reports.findMany({
        where: { Personnel_ID: personnelId, Report_Date: { gte: monthStart } },
        select: { Work_Hours: true, Manager_Score: true },
      }),
    ]);

  // ✅ فیکس باگ ۲: ساعت «موثر» — هماهنگ با ریز فعالیت‌ها و گزارش ماهانه
  //    (کوئری از اول ماه شمسی است؛ دیگر نیازی به فیلتر شمسی دستی نیست)
  const currentMonthHours = monthReports.reduce((sum, r) => {
    const actual = Number(r.Work_Hours || 0);
    const score = Number(r.Manager_Score ?? 100);
    return sum + actual * (score / 100);
  }, 0);

  // ✅ فیکس باگ ۴: روز ۱ تا ۳ «شمسی» — سمت سرور، بدون hydration mismatch
  const jalaliDay = getDate(now);
  const isReportAvailable = jalaliDay >= 1 && jalaliDay <= 3;

  return JSON.parse(
    JSON.stringify({
      pendingTasks,
      activeProjects: activeProjects.map((a: any) => a.PR_Projects),
      recentMissions,
      currentMonthHours: Number(currentMonthHours.toFixed(1)),
      maxMonthlyHours: MAX_MONTHLY_HOURS,
      pendingTasksCount,
      activeProjectsCount,
      isReportAvailable,
    })
  );
}

// ============================================================
//  ۲. داده‌های داشبورد مدیر کارخانه (مدیرعامل)
// ============================================================
export async function getManagerDashboardData() {
  const user = await getSession();
  if (!user) return null;

  const [pendingLeaves, pendingProjects, pendingMissions, activeProjects, activePersonnel, totalProjects, pendingTasks, recentReportsRaw] =
    await Promise.all([
      prisma.pR_Leave_Requests.count({ where: { Status: "Pending" } }),
      prisma.pR_Projects.count({ where: { Status: "OnHold" } }),
      prisma.pR_Commute_Logs.count({ where: { Status: "Pending" } }),
      prisma.pR_Projects.findMany({
        where: { Status: "Active" },
        orderBy: { Deadline_Date: "asc" },
        take: 4,
        include: { Project_Leader: true },
      }),
      prisma.personnel.count({ where: { IsActive: true } }),
      prisma.pR_Projects.count({ where: { Status: "Active" } }),
      prisma.pR_Tasks.count({ where: { Status: "Pending" } }),
      // ✅ فیکس باگ ۷: include مستقیم به‌جای نگاشت دستی دو مرحله‌ای
      prisma.pR_Daily_Reports.findMany({
        take: 5,
        orderBy: { Created_At: "desc" },
        include: {
          Personnel_PR_Daily_Reports_Personnel_IDToPersonnel: {
            select: { Personnel_ID: true, Full_Name: true, Personnel_Code: true },
          },
        },
      }),
    ]);

  // هماهنگ با ساختار قبلی کلاینت: r.Personnel.Full_Name
  const recentReports = recentReportsRaw.map((r: any) => ({
    ...r,
    Personnel: r.Personnel_PR_Daily_Reports_Personnel_IDToPersonnel || null,
  }));

  return JSON.parse(
    JSON.stringify({
      pendingApprovals: { leaves: pendingLeaves, projects: pendingProjects, missions: pendingMissions },
      activeProjects,
      stats: { activePersonnel, totalProjects, pendingTasks },
      recentReports,
    })
  );
}

// ============================================================
//  ۳. داده‌های داشبورد واحد مالی
// ============================================================
export async function getFinanceDashboardData() {
  const user = await getSession();
  if (!user) return null;

  const now = new Date();

  // ✅ فیکس باگ ۵: «ماه گذشته» بر اساس تقویم شمسی
  const lastJalaliMonth = subMonths(now, 1);
  const lastMonthStart = startOfMonth(lastJalaliMonth);
  const lastMonthEnd = endOfMonth(lastJalaliMonth);
  lastMonthEnd.setHours(23, 59, 59, 999);

  // پرسنلی که حقوق پایه برایشان تنظیم نشده
  const personnelData = await prisma.personnel.findMany({
    where: { IsActive: true, Role: { not: "CEO" } },
    include: {
      PR_Personnel_Finance_PR_Personnel_Finance_Personnel_IDToPersonnel: {
        where: { Is_Active: true },
        take: 1,
      },
    },
  });

  const missingSalaryList = personnelData
    .filter((p: any) => {
      const fin = p.PR_Personnel_Finance_PR_Personnel_Finance_Personnel_IDToPersonnel[0];
      return !fin || Number(fin.Base_Monthly_Salary) === 0 || Number(fin.Base_Hourly_Rate) === 0;
    })
    .map((p: any) => ({ Personnel_ID: p.Personnel_ID, Full_Name: p.Full_Name, Personnel_Code: p.Personnel_Code }));

  // پاداش پروژه‌های تکمیل‌شده ماه گذشته (شمسی)
  const completedProjects = await prisma.pR_Projects.findMany({
    where: {
      Status: "Completed",
      Updated_At: { gte: lastMonthStart, lte: lastMonthEnd },
    },
    select: { Final_Bonus: true, Project_Name: true },
  });

  const totalBonuses = completedProjects.reduce((sum: number, p: any) => sum + Number(p.Final_Bonus || 0), 0);

  return JSON.parse(
    JSON.stringify({
      missingSalaryList,
      missingSalaryCount: missingSalaryList.length,
      totalBonuses,
      bonusProjectCount: completedProjects.length,
    })
  );
}