"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getMonth, getDate, getDay, getYear } from "date-fns-jalali";
import { verifySession } from "@/lib/session";

export async function getMyMonthlyWorkHours() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;

  const user = await verifySession(session); // تغییر کرد
  if (!user) return []; // اضافه شد

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return null;

  const now = new Date();
  // محاسبه ماه و سال شمسی فعلی
  const persianMonth = getMonth(now); 
  const persianYear = getYear(now); // نیاز به ایمپورت getYear
  const persianDay = getDate(now);
  const persianDayOfWeek = getDay(now); // 0 = شنبه، 6 = جمعه

  // محاسبه اینکه الان در هفته چندم ماه قرار داریم
  let currentWeek = 1;
  if (persianDay >= 8 && persianDay <= 14) currentWeek = 2;
  else if (persianDay >= 15 && persianDay <= 21) currentWeek = 3;
  else if (persianDay >= 22 && persianDay <= 28) currentWeek = 4;
  else if (persianDay > 28) currentWeek = 5; // روزهای آخر ماه

  // گرفتن گزارش‌های ۳۱ روز اخیر برای پوشش ماه جاری
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 31);

  const reports = await prisma.pR_Daily_Reports.findMany({
    where: {
      Personnel_ID: dbUser.Personnel_ID,
      Report_Date: { gte: startDate }
    },
    orderBy: { Report_Date: 'asc' }
  });

  // فیلتر کردن دقیق فقط برای ماه شمسی جاری (برای ریست شدن در ماه جدید)
  const currentMonthReports = reports.filter(r => {
    const rDate = new Date(r.Report_Date);
    return getMonth(rDate) === persianMonth && getYear(rDate) === persianYear;
  });

  // ساختار داده‌ها برای تقسیم هفته‌ها
  const data: any = {
    currentWeek,
    week1: { hours: 0, days: 0 },
    week2: { hours: 0, days: 0 },
    week3: { hours: 0, days: 0 },
    week4: { hours: 0, days: 0 },
    monthEnd: { hours: 0, days: 0 },
    friday: { hours: 0, days: 0 },
    holiday: { hours: 0, days: 0 }
  };

  // گروه‌بندی گزارش‌ها بر اساس روز
  const dailyMap: any = {};
  currentMonthReports.forEach(r => {
    const dateKey = new Date(r.Report_Date).toDateString();
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = { hours: 0, date: new Date(r.Report_Date) };
    }
    dailyMap[dateKey].hours += parseFloat(r.Work_Hours?.toString() || '0');
  });

  const uniqueDays = Object.values(dailyMap);

  uniqueDays.forEach((d: any) => {
    const rDate = d.date;
    const rDay = getDate(rDate);
    const rDayOfWeek = getDay(rDate);
    const hours = parseFloat(d.hours.toFixed(2));

    if (rDay >= 1 && rDay <= 7) { data.week1.hours += hours; data.week1.days++; }
    else if (rDay >= 8 && rDay <= 14) { data.week2.hours += hours; data.week2.days++; }
    else if (rDay >= 15 && rDay <= 21) { data.week3.hours += hours; data.week3.days++; }
    else if (rDay >= 22 && rDay <= 28) { data.week4.hours += hours; data.week4.days++; }
    else { data.monthEnd.hours += hours; data.monthEnd.days++; }

    if (rDayOfWeek === 6) { data.friday.hours += hours; data.friday.days++; }
  });

  const weekKeys = ['week1', 'week2', 'week3', 'week4', 'monthEnd', 'friday', 'holiday'] as const;
  weekKeys.forEach(k => {
    data[k].hours = parseFloat(data[k].hours.toFixed(2));
  });

  return JSON.parse(JSON.stringify(data));
}

// ۲. گرفتن ریز گزارشات یک دوره خاص (هفته یا جمعه و...)
export async function getMyPeriodDetails(period: string) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;

  const user = await verifySession(session); // تغییر کرد
  if (!user) return []; // اضافه شد
  
  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return null;

  const now = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 31); // پوشش کل ماه شمسی

  const reports = await prisma.pR_Daily_Reports.findMany({
    where: { Personnel_ID: dbUser.Personnel_ID, Report_Date: { gte: startDate } },
    include: { PR_Work_Types: true },
    orderBy: { Report_Date: 'asc' }
  });

  const projects = await prisma.pR_Project_Assignments.findMany({
    where: { Personnel_ID: dbUser.Personnel_ID, Is_Active: true },
    include: { PR_Projects: true }
  });

  const missions = await prisma.pR_Commute_Logs.findMany({
    where: { Personnel_ID: dbUser.Personnel_ID, Commute_Date: { gte: startDate } },
    orderBy: { Commute_Date: 'asc' }
  });

  const holidays = await prisma.pR_Holidays.findMany({ where: { Date: { gte: startDate } } });
  const holidayDates = holidays.map(h => new Date(h.Date).toDateString());

  // فیلتر کردن گزارش‌ها بر اساس دوره انتخاب شده
  const filteredReports = reports.filter(r => {
    const rDate = new Date(r.Report_Date);
    const rDay = getDate(rDate);
    const rDayOfWeek = getDay(rDate);

    if (period === 'week1') return rDay >= 1 && rDay <= 7;
    if (period === 'week2') return rDay >= 8 && rDay <= 14;
    if (period === 'week3') return rDay >= 15 && rDay <= 21;
    if (period === 'week4') return rDay >= 22 && rDay <= 28;
    if (period === 'monthEnd') return rDay > 28;
    if (period === 'friday') return rDayOfWeek === 6;
    if (period === 'holiday') return holidayDates.includes(rDate.toDateString());
    return false;
  });

  // گروه‌بندی فعالیت‌ها بر اساس روز و جمع ساعت‌ها
  const dailyGrouped = filteredReports.reduce((acc: any, r) => {
    const dateKey = new Date(r.Report_Date).toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = {
        Report_Date: r.Report_Date,
        Check_In: r.Check_In,
        Check_Out: r.Check_Out,
        Work_Hours: 0,
        PR_Work_Types: r.PR_Work_Types,
        activities: []
      };
    }
    acc[dateKey].Work_Hours += parseFloat(r.Work_Hours?.toString() || '0');
    acc[dateKey].activities.push(r);
    
    // اگر Check_Out جدیدتر است، آن را قرار بده
    if (r.Check_Out && (!acc[dateKey].Check_Out || new Date(r.Check_Out) > new Date(acc[dateKey].Check_Out))) {
      acc[dateKey].Check_Out = r.Check_Out;
    }
    
    return acc;
  }, {});

  const groupedReports = Object.values(dailyGrouped).map((g: any) => ({
    ...g,
    Work_Hours: g.Work_Hours.toFixed(2)
  }));

  // محاسبه مجموع کل
  let totalHours = 0;
  let fridayHours = 0;
  let holidayHours = 0;

  groupedReports.forEach((r: any) => {
    const hours = parseFloat(r.Work_Hours);
    totalHours += hours;
    const rDate = new Date(r.Report_Date);
    if (getDay(rDate) === 6) fridayHours += hours;
    if (holidayDates.includes(rDate.toDateString())) holidayHours += hours;
  });

  const finance = await prisma.pR_Personnel_Finance.findFirst({ 
    where: { Personnel_ID: dbUser.Personnel_ID, Is_Active: true } 
  });

  let maxHours = 0;
  let maxOvertime = 0;
  let periodLabel = "";

  const periodMap: any = {
    week1: { label: "هفته اول", max: finance?.Week1_Max_Hours, ot: finance?.Week1_Max_Overtime },
    week2: { label: "هفته دوم", max: finance?.Week2_Max_Hours, ot: finance?.Week2_Max_Overtime },
    week3: { label: "هفته سوم", max: finance?.Week3_Max_Hours, ot: finance?.Week3_Max_Overtime },
    week4: { label: "هفته چهارم", max: finance?.Week4_Max_Hours, ot: finance?.Week4_Max_Overtime },
    monthEnd: { label: "روزهای آخر ماه", max: finance?.MonthEnd_Max_Hours, ot: finance?.MonthEnd_Max_Overtime },
    friday: { label: "جمعه‌های کاری", max: finance?.Max_Friday_Hours_Month, ot: 0 },
    holiday: { label: "تعطیلات کاری", max: finance?.Max_Holiday_Hours_Month, ot: 0 }
  };

  const periodData = periodMap[period];
  if (periodData) {
    maxHours = Number(periodData.max || 0);
    maxOvertime = Number(periodData.ot || 0);
    periodLabel = periodData.label;
  }

  const regularHours = Math.min(totalHours, maxHours);
  const overtimeHours = Math.max(0, totalHours - maxHours);
  const difference = totalHours - maxHours;

  return JSON.parse(JSON.stringify({
    reports: groupedReports,  // تغییر از filteredReports به groupedReports
    rawReports: filteredReports, // گزارش‌های خام برای جدول ریز (اختیاری)
    projects: projects.map((p:any) => p.PR_Projects),
    missions,
    summary: {
      periodLabel,
      totalHours: parseFloat(totalHours.toFixed(2)),
      maxHours: Number(maxHours),
      maxOvertime: Number(maxOvertime),
      regularHours: parseFloat(regularHours.toFixed(2)),
      overtimeHours: parseFloat(overtimeHours.toFixed(2)),
      difference: parseFloat(difference.toFixed(2)),
      fridayHours: parseFloat(fridayHours.toFixed(2)),
      holidayHours: parseFloat(holidayHours.toFixed(2))
    }
  }));
}

// ۳. گرفتن خلاصه گزارش پاداش و جریمه ماه گذشته
export async function getMonthlySummary() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;

  const user = await verifySession(session); // تغییر کرد
  if (!user) return []; // اضافه شد

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return null;

  const now = new Date();
  // محاسبه ماه گذشته
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  const reports = await prisma.pR_Daily_Reports.findMany({
    where: { Personnel_ID: dbUser.Personnel_ID, Report_Date: { gte: startDate, lte: endDate } }
  });

  const totalHours = reports.reduce((sum, r) => sum + Number(r.Work_Hours || 0), 0);

  // گرفتن تنظیمات مالی کاربر و شرکت
  const settings = await prisma.pR_Payroll_Settings.findFirst();
  const finance = await prisma.pR_Personnel_Finance.findFirst({
    where: { Personnel_ID: dbUser.Personnel_ID, Is_Active: true }
  });

  // خواندن حقوق پایه ثابت ماهانه و نرخ ساعتی
  const baseMonthlySalary = Number(finance?.Base_Monthly_Salary || 0);
  const baseHourlyRate = Number(finance?.Base_Hourly_Rate || settings?.Base_Regular_Hourly_Rate || 0);
  
  // حد نصاب ماهانه (فعلا ۱۹۲ ساعت)
  const maxMonthlyHours = 192; 

  const missingHours = Math.max(0, maxMonthlyHours - totalHours);
  const penaltyPercent = Number(settings?.Delay_Penalty_Percent || 0);
  
  // محاسبه جریمه: (ساعات کم کار * نرخ ساعتی) * (درصد جریمه / ۱۰۰)
  const penaltyAmount = Math.round(missingHours * baseHourlyRate);

  // گرفتن پروژه‌های تکمیل شده در ماه گذشته
  const completedProjects = await prisma.pR_Projects.findMany({
    where: {
      Status: 'Completed',
      Updated_At: { gte: startDate, lte: endDate },
      PR_Project_Assignments: { some: { Personnel_ID: dbUser.Personnel_ID } }
    }
  });

  const totalBonus = completedProjects.reduce((sum, p) => sum + Number(p.Final_Bonus || 0), 0);
  
  // حقوق پایه = حقوق ثابت ماهانه (اگر بود) در غیر این صورت محاسبه از ساعات کارکرد
  const baseSalary = baseMonthlySalary > 0 ? baseMonthlySalary : Math.round(totalHours * baseHourlyRate);
  
  const netSalary = baseSalary - penaltyAmount + totalBonus;

  // ساخت رشته تاریخ با فرمت درست (مثلا: گزارش تیر ماه ۱۴۰۵)
  const monthName = new Date(startDate).toLocaleDateString('fa-IR', { month: 'long' });
  const yearNum = new Date(startDate).toLocaleDateString('fa-IR', { year: 'numeric' });

  return JSON.parse(JSON.stringify({
    periodLabel: `گزارش ${monthName} ماه ${yearNum}`,
    totalHours: totalHours.toFixed(2),
    maxHours: maxMonthlyHours,
    missingHours: missingHours.toFixed(2),
    baseHourlyRate,
    baseSalary, 
    penaltyPercent,
    penaltyAmount,
    totalBonus,
    netSalary,
    projects: completedProjects.map(p => ({ name: p.Project_Name, bonus: Number(p.Final_Bonus || 0) }))
  }));
}