"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getMonth, getDate, getDay, getYear, subMonths, startOfMonth, endOfMonth } from "date-fns-jalali";
import { verifySession } from "@/lib/session";

// ============================================================
//  ثابت‌ها و توابع کمکی
// ============================================================

// ✅ کلیدهای معتبر دوره — دقیقاً هماهنگ با periodMap پایین فایل
const VALID_PERIODS = ["week1", "week2", "week3", "week4", "monthEnd", "friday", "holiday"] as const;

// تابع کمکی محاسبه ساعت موثر
const calcEffectiveHours = (report: any) => {
  const actualHours = Number(report.Work_Hours || 0);
  const managerScore = Number(report.Manager_Score || 100);
  return actualHours * (managerScore / 100);
};

const round2 = (v: any) => parseFloat(Number(v || 0).toFixed(2));
const pad2 = (n: number) => String(n).padStart(2, "0");

// نام روز هفته بر اساس getDay() جاوااسکریپت (۰=یکشنبه ... ۵=جمعه، ۶=شنبه)
const WEEKDAY_FA = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

// تاریخ شمسی به شکل 1404/07/12 — بدون وابستگی به format
const toJalaliStr = (d: Date) => `${getYear(d)}/${pad2(getMonth(d) + 1)}/${pad2(getDate(d))}`;

// ============================================================
//  ✅ فیلتر دوره با گارد «ماه جاری شمسی»
//  گزارش‌های ماه قبل دیگر به هفته‌های ماه جاری نشت نمی‌کنند
// ============================================================
function makePeriodFilter(period: string, holidayDates: string[] = []) {
  const now = new Date();
  const currentJalaliMonth = getMonth(now);
  const currentJalaliYear = getYear(now);

  return (r: any) => {
    const rDate = new Date(r.Report_Date);

    // گارد ماه: فقط گزارش‌های ماه شمسی جاری
    if (getMonth(rDate) !== currentJalaliMonth || getYear(rDate) !== currentJalaliYear) {
      return false;
    }

    const rDay = getDate(rDate);
    const rDayOfWeek = getDay(rDate);

    if (period === "week1")    return rDay >= 1 && rDay <= 7;
    if (period === "week2")    return rDay >= 8 && rDay <= 14;
    if (period === "week3")    return rDay >= 15 && rDay <= 21;
    if (period === "week4")    return rDay >= 22 && rDay <= 28;
    if (period === "monthEnd") return rDay > 28;
    if (period === "friday")   return rDayOfWeek === 5; // ✅ فیکس: جمعه = 5 (قبلاً 6 یعنی شنبه)
    if (period === "holiday")  return holidayDates.includes(rDate.toDateString());
    return false;
  };
}

// نام ماه و سال شمسی (بدون وابستگی به locale اضافه)
function formatJalaliMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "long", year: "numeric" }).format(date);
}

// ============================================================
//  ۱. خلاصه ساعات کار ماه جاری (نمای هفتگی)
// ============================================================
export async function getMyMonthlyWorkHours() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;

  const user = await verifySession(session);
  if (!user) return null;

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return null;

  const now = new Date();
  const persianMonth = getMonth(now);
  const persianYear = getYear(now);
  const persianDay = getDate(now);

  let currentWeek = 1;
  if (persianDay >= 8 && persianDay <= 14) currentWeek = 2;
  else if (persianDay >= 15 && persianDay <= 21) currentWeek = 3;
  else if (persianDay >= 22 && persianDay <= 28) currentWeek = 4;
  else if (persianDay > 28) currentWeek = 5;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 31);

  const reports = await prisma.pR_Daily_Reports.findMany({
    where: {
      Personnel_ID: dbUser.Personnel_ID,
      Report_Date: { gte: startDate },
    },
    orderBy: { Report_Date: "asc" },
  });

  const currentMonthReports = reports.filter((r: any) => {
    const rDate = new Date(r.Report_Date);
    return getMonth(rDate) === persianMonth && getYear(rDate) === persianYear;
  });

  // تعطیلات رسمی برای باکت holiday
  const holidays = await prisma.pR_Holidays.findMany({
    where: { Date: { gte: startDate } },
  });
  const holidayDates = holidays.map((h: any) => new Date(h.Date).toDateString());

  const data: any = {
    currentWeek,
    week1:    { actualHours: 0, effectiveHours: 0, days: 0 },
    week2:    { actualHours: 0, effectiveHours: 0, days: 0 },
    week3:    { actualHours: 0, effectiveHours: 0, days: 0 },
    week4:    { actualHours: 0, effectiveHours: 0, days: 0 },
    monthEnd: { actualHours: 0, effectiveHours: 0, days: 0 },
    friday:   { actualHours: 0, effectiveHours: 0, days: 0 },
    holiday:  { actualHours: 0, effectiveHours: 0, days: 0 },
  };

  const dailyMap: any = {};
  currentMonthReports.forEach((r: any) => {
    const dateKey = new Date(r.Report_Date).toDateString();
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = { actualHours: 0, effectiveHours: 0, date: new Date(r.Report_Date) };
    }
    dailyMap[dateKey].actualHours += Number(r.Work_Hours || 0);
    dailyMap[dateKey].effectiveHours += calcEffectiveHours(r);
  });

  const uniqueDays = Object.values(dailyMap);

  uniqueDays.forEach((d: any) => {
    const rDate = d.date;
    const rDay = getDate(rDate);
    const rDayOfWeek = getDay(rDate);
    const actual = d.actualHours;
    const effective = d.effectiveHours;

    // تقسیم روزها به هفته‌ها
    if (rDay >= 1 && rDay <= 7) { data.week1.actualHours += actual; data.week1.effectiveHours += effective; data.week1.days++; }
    else if (rDay >= 8 && rDay <= 14) { data.week2.actualHours += actual; data.week2.effectiveHours += effective; data.week2.days++; }
    else if (rDay >= 15 && rDay <= 21) { data.week3.actualHours += actual; data.week3.effectiveHours += effective; data.week3.days++; }
    else if (rDay >= 22 && rDay <= 28) { data.week4.actualHours += actual; data.week4.effectiveHours += effective; data.week4.days++; }
    else { data.monthEnd.actualHours += actual; data.monthEnd.effectiveHours += effective; data.monthEnd.days++; }

    // ✅ فیکس: جمعه = 5 (قبلاً 6 یعنی شنبه شمرده می‌شد)
    if (rDayOfWeek === 5) { data.friday.actualHours += actual; data.friday.effectiveHours += effective; data.friday.days++; }
    if (holidayDates.includes(rDate.toDateString())) { data.holiday.actualHours += actual; data.holiday.effectiveHours += effective; data.holiday.days++; }
  });

  const weekKeys = ["week1", "week2", "week3", "week4", "monthEnd", "friday", "holiday"] as const;
  weekKeys.forEach((k) => {
    data[k].actualHours = parseFloat(data[k].actualHours.toFixed(2));
    data[k].effectiveHours = parseFloat(data[k].effectiveHours.toFixed(2));
    data[k].actualHoursStr = data[k].actualHours.toFixed(2);
    data[k].effectiveHoursStr = data[k].effectiveHours.toFixed(2);
    data[k].hours = data[k].effectiveHoursStr;
  });

  return JSON.parse(JSON.stringify(data));
}

// ============================================================
//  ۲. ریز گزارش‌های یک دوره خاص (هفته / جمعه / تعطیل / اواخر ماه)
// ============================================================
export async function getMyPeriodDetails(period: string) {
  const safePeriod = (VALID_PERIODS as readonly string[]).includes(period) ? period : "week1";

  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) return { rawReports: [], reports: [], projects: [], missions: [], summary: { periodLabel: "-" } };

  const user = await verifySession(session);
  if (!user) return { rawReports: [], reports: [], projects: [], missions: [], summary: { periodLabel: "-" } };

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) {
    return { rawReports: [], reports: [], projects: [], missions: [], summary: { periodLabel: "-" } };
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 31);

  const reports = await prisma.pR_Daily_Reports.findMany({
    where: { Personnel_ID: dbUser.Personnel_ID, Report_Date: { gte: startDate } },
    include: { PR_Work_Types: true, PR_Projects: true },
    orderBy: { Report_Date: "asc" },
  });

  const projects = await prisma.pR_Project_Assignments.findMany({
    where: { Personnel_ID: dbUser.Personnel_ID, Is_Active: true },
    include: { PR_Projects: true },
  });

  const missions = await prisma.pR_Commute_Logs.findMany({
    where: { Personnel_ID: dbUser.Personnel_ID, Commute_Date: { gte: startDate } },
    orderBy: { Commute_Date: "asc" },
  });

  const holidays = await prisma.pR_Holidays.findMany({ where: { Date: { gte: startDate } } });
  const holidayDates = holidays.map((h: any) => new Date(h.Date).toDateString());

  const periodFilter = makePeriodFilter(safePeriod, holidayDates);
  const filteredReports = reports.filter(periodFilter);

  // ---------- گروه‌بندی روزانه ----------
  const dailyGrouped = filteredReports.reduce((acc: any, r: any) => {
    const dateKey = new Date(r.Report_Date).toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = {
        Report_Date: r.Report_Date,
        Check_In: r.Check_In,
        Check_Out: r.Check_Out,
        Work_Hours: 0,
        Effective_Hours: 0,
        PR_Work_Types: r.PR_Work_Types,
        activities: [],
      };
    }
    acc[dateKey].Work_Hours += Number(r.Work_Hours || 0);
    acc[dateKey].Effective_Hours += calcEffectiveHours(r);
    acc[dateKey].activities.push(r);

    if (r.Check_Out && (!acc[dateKey].Check_Out || new Date(r.Check_Out) > new Date(acc[dateKey].Check_Out))) {
      acc[dateKey].Check_Out = r.Check_Out;
    }

    return acc;
  }, {});

  const groupedReports = Object.values(dailyGrouped).map((g: any) => ({
    ...g,
    Work_Hours: g.Work_Hours.toFixed(2),
    Effective_Hours: g.Effective_Hours.toFixed(2),
  }));

  // ---------- جمع‌های خلاصه ----------
  let totalActualHours = 0;
  let totalEffectiveHours = 0;
  let fridayEffectiveHours = 0;
  let holidayEffectiveHours = 0;

  groupedReports.forEach((r: any) => {
    const actual = parseFloat(r.Work_Hours);
    const effective = parseFloat(r.Effective_Hours);
    totalActualHours += actual;
    totalEffectiveHours += effective;

    const rDate = new Date(r.Report_Date);
    if (getDay(rDate) === 5) fridayEffectiveHours += effective; // ✅ فیکس: جمعه = 5
    if (holidayDates.includes(rDate.toDateString())) holidayEffectiveHours += effective;
  });

  const finance = await prisma.pR_Personnel_Finance.findFirst({
    where: { Personnel_ID: dbUser.Personnel_ID, Is_Active: true },
  });

  let maxHours = 0;
  let maxOvertime = 0;
  let periodLabel = "";

  const periodMap: any = {
    week1:    { label: "هفته اول",         max: finance?.Week1_Max_Hours,          ot: finance?.Week1_Max_Overtime },
    week2:    { label: "هفته دوم",         max: finance?.Week2_Max_Hours,          ot: finance?.Week2_Max_Overtime },
    week3:    { label: "هفته سوم",         max: finance?.Week3_Max_Hours,          ot: finance?.Week3_Max_Overtime },
    week4:    { label: "هفته چهارم",       max: finance?.Week4_Max_Hours,          ot: finance?.Week4_Max_Overtime },
    monthEnd: { label: "روزهای آخر ماه",   max: finance?.MonthEnd_Max_Hours,       ot: finance?.MonthEnd_Max_Overtime },
    friday:   { label: "جمعه‌های کاری",    max: finance?.Max_Friday_Hours_Month,   ot: 0 },
    holiday:  { label: "تعطیلات کاری",     max: finance?.Max_Holiday_Hours_Month,  ot: 0 },
  };

  const periodData = periodMap[safePeriod];
  if (periodData) {
    maxHours = Number(periodData.max || 0);
    maxOvertime = Number(periodData.ot || 0);
    periodLabel = periodData.label;
  }

  // محاسبات بر اساس ساعت موثر
  const regularHours = Math.min(totalEffectiveHours, maxHours);
  const overtimeHours = Math.max(0, totalEffectiveHours - maxHours);
  const difference = totalEffectiveHours - maxHours;

  return JSON.parse(
    JSON.stringify({
      reports: groupedReports,
      rawReports: filteredReports,
      projects: projects.map((p: any) => p.PR_Projects),
      missions,
      summary: {
        periodLabel,
        totalHours: parseFloat(totalEffectiveHours.toFixed(2)),
        totalEffectiveHours: parseFloat(totalEffectiveHours.toFixed(2)),
        totalActualHours: parseFloat(totalActualHours.toFixed(2)),
        maxHours: Number(maxHours),
        maxOvertime: Number(maxOvertime),
        regularHours: parseFloat(regularHours.toFixed(2)),
        overtimeHours: parseFloat(overtimeHours.toFixed(2)),
        difference: parseFloat(difference.toFixed(2)),
        fridayHours: parseFloat(fridayEffectiveHours.toFixed(2)),
        holidayHours: parseFloat(holidayEffectiveHours.toFixed(2)),
      },
    })
  );
}

// ============================================================
//  ۳. خلاصه کارکرد ماه گذشته — فقط کارکرد، بدون هیچ مبلغی
//  (محاسبه حقوق رسمی در موتور فیش حقوقی و صفحه «فیش حقوقی من» است)
// ============================================================
export async function getMonthlySummary() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;

  const user = await verifySession(session);
  if (!user) return null;

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return null;

  // ماه گذشته بر اساس تقویم شمسی
  const lastJalaliMonth = subMonths(new Date(), 1);
  const startDate = startOfMonth(lastJalaliMonth);
  const endDate = endOfMonth(lastJalaliMonth);
  endDate.setHours(23, 59, 59, 999);

  const reports = await prisma.pR_Daily_Reports.findMany({
    where: { Personnel_ID: dbUser.Personnel_ID, Report_Date: { gte: startDate, lte: endDate } },
    orderBy: { Report_Date: "asc" },
  });

  // حد نصاب‌های هفتگی از پارامترهای مالی پرسنل (فقط سقف ساعت — نه مبلغ)
  const finance = await prisma.pR_Personnel_Finance.findFirst({
    where: { Personnel_ID: dbUser.Personnel_ID, Is_Active: true },
  });

  // تعطیلات رسمی همان ماه
  const holidays = await prisma.pR_Holidays.findMany({
    where: { Date: { gte: startDate, lte: endDate } },
  });
  const holidaySet = new Set(holidays.map((h: any) => new Date(h.Date).toDateString()));

  const maxMonthlyHours = 192; // هماهنگ با موتور فیش حقوقی (۲۴ روز × ۸ ساعت)

  // ---------- گروه‌بندی روزانه ----------
  const dailyMap: any = {};
  reports.forEach((r: any) => {
    const key = new Date(r.Report_Date).toDateString();
    if (!dailyMap[key]) dailyMap[key] = { date: new Date(r.Report_Date), actual: 0, effective: 0 };
    dailyMap[key].actual += Number(r.Work_Hours || 0);
    dailyMap[key].effective += calcEffectiveHours(r);
  });
  const days = Object.values(dailyMap) as any[];

  const weeks: any = {
    week1:    { label: "هفته اول",       actual: 0, effective: 0, days: 0, max: Number(finance?.Week1_Max_Hours || 0) },
    week2:    { label: "هفته دوم",       actual: 0, effective: 0, days: 0, max: Number(finance?.Week2_Max_Hours || 0) },
    week3:    { label: "هفته سوم",       actual: 0, effective: 0, days: 0, max: Number(finance?.Week3_Max_Hours || 0) },
    week4:    { label: "هفته چهارم",     actual: 0, effective: 0, days: 0, max: Number(finance?.Week4_Max_Hours || 0) },
    monthEnd: { label: "روزهای آخر ماه", actual: 0, effective: 0, days: 0, max: Number(finance?.MonthEnd_Max_Hours || 0) },
  };

  let totalActual = 0, totalEffective = 0, overtimeHours = 0;
  let fridayActual = 0, fridayEffective = 0, fridayDays = 0;
  let holidayActual = 0, holidayEffective = 0, holidayDays = 0;

  const daily = days.map((d: any) => {
    const rDate = d.date;
    const isFriday = getDay(rDate) === 5; // ✅ جمعه = 5 در getDay جاوااسکریپت
    const isHoliday = holidaySet.has(rDate.toDateString());

    totalActual += d.actual;
    totalEffective += d.effective;
    overtimeHours += Math.max(0, d.effective - 8); // اضافه‌کار تقریبی: موثر فراتر از ۸ ساعت روزانه

    if (isFriday)  { fridayActual += d.actual; fridayEffective += d.effective; fridayDays++; }
    if (isHoliday) { holidayActual += d.actual; holidayEffective += d.effective; holidayDays++; }

    const rDay = getDate(rDate);
    let wk = "monthEnd";
    if (rDay >= 1 && rDay <= 7) wk = "week1";
    else if (rDay <= 14) wk = "week2";
    else if (rDay <= 21) wk = "week3";
    else if (rDay <= 28) wk = "week4";
    weeks[wk].actual += d.actual;
    weeks[wk].effective += d.effective;
    weeks[wk].days++;

    return {
      dateStr: toJalaliStr(rDate),
      weekday: WEEKDAY_FA[getDay(rDate)] || "-",
      actual: round2(d.actual),
      effective: round2(d.effective),
      isFriday,
      isHoliday,
    };
  });

  // پروژه‌های تکمیل‌شده این ماه (فقط اطلاعاتی — مبلغ پاداش در فیش رسمی می‌آید)
  const completedProjects = await prisma.pR_Projects.findMany({
    where: {
      Status: "Completed",
      Updated_At: { gte: startDate, lte: endDate },
      PR_Project_Assignments: { some: { Personnel_ID: dbUser.Personnel_ID } },
    },
    select: { Project_ID: true, Project_Name: true },
    orderBy: { Updated_At: "desc" },
  });

  const missingHours = Math.max(0, maxMonthlyHours - totalEffective);
  const completionPercent = Math.min(100, Math.round((totalEffective / maxMonthlyHours) * 100));

  return JSON.parse(
    JSON.stringify({
      periodLabel: `گزارش ${formatJalaliMonthYear(startDate)}`,
      // سازگاری با کلیدهای قبلی (اگر جای دیگری استفاده شده باشد)
      totalHours: round2(totalEffective),
      maxHours: maxMonthlyHours,
      // خروجی غنی جدید
      totalEffectiveHours: round2(totalEffective),
      totalActualHours: round2(totalActual),
      maxMonthlyHours,
      missingHours: round2(missingHours),
      completionPercent,
      overtimeHours: round2(overtimeHours),
      workDays: days.length,
      friday:  { effective: round2(fridayEffective),  actual: round2(fridayActual),  days: fridayDays },
      holiday: { effective: round2(holidayEffective), actual: round2(holidayActual), days: holidayDays },
      weeks: Object.keys(weeks).map((k) => ({ key: k, ...weeks[k] })),
      daily,
      projects: completedProjects.map((p: any) => ({ id: p.Project_ID, name: p.Project_Name })),
    })
  );
}