"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { getMonth, getYear } from "date-fns-jalali";

// تابع کمکی برای خواندن سشن امن
async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return await verifySession(token);
}

// ۱. داده‌های داشبورد کارمند
export async function getEmployeeDashboardData() {
  const user = await getSession();
  if (!user) return null;

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return null;

  const personnelId = dbUser.Personnel_ID;
  const now = new Date();
  const persianMonth = getMonth(now);
  const persianYear = getYear(now);

  // ابلاغیه‌های در انتظار انجام
  const pendingTasks = await prisma.pR_Tasks.findMany({
    where: { Assigned_To: personnelId, Status: "Pending" },
    orderBy: { Created_At: "desc" },
    take: 3,
  });

  // پروژه‌های در حال انجام
  const activeProjects = await prisma.pR_Project_Assignments.findMany({
    where: { Personnel_ID: personnelId, Is_Active: true, PR_Projects: { Status: "Active" } },
    include: { PR_Projects: true },
    take: 3,
  });

  // وضعیت فعالیت امروز
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayActivity = await prisma.pR_Daily_Reports.findFirst({
    where: { Personnel_ID: personnelId, Report_Date: { gte: todayStart } },
    orderBy: { Report_Date: "desc" },
  });

  // مجموع ساعت کارکرد ماه جاری
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthReports = await prisma.pR_Daily_Reports.findMany({
    where: { Personnel_ID: personnelId, Report_Date: { gte: monthStart } },
  });
  
  const currentMonthHours = monthReports
    .filter(r => getMonth(new Date(r.Report_Date)) === persianMonth && getYear(new Date(r.Report_Date)) === persianYear)
    .reduce((sum, r) => sum + Number(r.Work_Hours || 0), 0);

  const maxMonthlyHours = 192;

  return JSON.parse(JSON.stringify({
    pendingTasks,
    activeProjects: activeProjects.map(a => a.PR_Projects),
    todayActivity,
    currentMonthHours: currentMonthHours.toFixed(1),
    maxMonthlyHours,
    pendingTasksCount: pendingTasks.length,
    activeProjectsCount: activeProjects.length,
  }));
}

// ۲. داده‌های داشبورد مدیر کارخانه (مدیر عامل)
export async function getManagerDashboardData() {
  const user = await getSession();
  // در سیستم جدید، چک نمی‌کنیم که نقشش چیست، فقط چک می‌کنیم که لاگین کرده باشد
  if (!user) return null;

  // شمارش درخواست‌های در انتظار تایید
  const pendingLeaves = await prisma.pR_Leave_Requests.count({ where: { Status: "Pending" } });
  const pendingProjects = await prisma.pR_Projects.count({ where: { Status: "OnHold" } });
  const pendingMissions = await prisma.pR_Commute_Logs.count({ where: { Status: "Pending" } });

  // پروژه‌های در حال انجام
  const activeProjects = await prisma.pR_Projects.findMany({
    where: { Status: "Active" },
    orderBy: { Deadline_Date: "asc" },
    take: 4,
    include: { Project_Leader: true }
  });

  // آمار کلی
  const activePersonnel = await prisma.personnel.count({ where: { IsActive: true } });
  const totalProjects = await prisma.pR_Projects.count({ where: { Status: "Active" } });
  const pendingTasks = await prisma.pR_Tasks.count({ where: { Status: "Pending" } });

  // آخرین فعالیت‌های ثبت شده
  const recentReportsRaw = await prisma.pR_Daily_Reports.findMany({
    take: 5,
    orderBy: { Created_At: "desc" }
  });

  // گرفتن نام پرسنل‌ها
  const personnelIds = [...new Set(recentReportsRaw.map(r => r.Personnel_ID))];
  const personnelList = await prisma.personnel.findMany({
    where: { Personnel_ID: { in: personnelIds } },
    select: { Personnel_ID: true, Full_Name: true }
  });

  const recentReports = recentReportsRaw.map(r => ({
    ...r,
    Personnel: personnelList.find(p => p.Personnel_ID === r.Personnel_ID) || null
  }));

  return JSON.parse(JSON.stringify({
    pendingApprovals: { leaves: pendingLeaves, projects: pendingProjects, missions: pendingMissions },
    activeProjects,
    stats: { activePersonnel, totalProjects, pendingTasks },
    recentReports
  }));
}

// ۳. داده‌های داشبورد واحد مالی
export async function getFinanceDashboardData() {
  const user = await getSession();
  // در سیستم جدید فقط چک می‌کنیم لاگین کرده باشد
  if (!user) return null;

  // پیدا کردن پرسنلی که حقوق پایه برایشان تنظیم نشده
  // اصلاح شد: Contractor حذف و CEO قرار داده شد
  const personnelData = await prisma.personnel.findMany({
    where: { IsActive: true, Role: { not: 'CEO' } },
    include: {
      PR_Personnel_Finance_PR_Personnel_Finance_Personnel_IDToPersonnel: {
        where: { Is_Active: true },
        take: 1
      }
    }
  });

  const missingSalaryList = personnelData.filter(p => {
    const fin = p.PR_Personnel_Finance_PR_Personnel_Finance_Personnel_IDToPersonnel[0];
    return !fin || Number(fin.Base_Monthly_Salary) === 0 || Number(fin.Base_Hourly_Rate) === 0;
  }).map(p => ({ Personnel_ID: p.Personnel_ID, Full_Name: p.Full_Name, Personnel_Code: p.Personnel_Code }));

  // مجموع پاداش‌های پروژه‌های تکمیل شده ماه گذشته
  const now = new Date();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const completedProjects = await prisma.pR_Projects.findMany({
    where: { 
      Status: 'Completed', 
      Updated_At: { gte: lastMonthStart, lt: thisMonthStart } 
    },
    select: { Final_Bonus: true, Project_Name: true }
  });
  
  const totalBonuses = completedProjects.reduce((sum, p) => sum + Number(p.Final_Bonus || 0), 0);

  return JSON.parse(JSON.stringify({
    missingSalaryList,
    missingSalaryCount: missingSalaryList.length,
    totalBonuses,
    bonusProjectCount: completedProjects.length
  }));
}