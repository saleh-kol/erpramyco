"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import {
  startOfMonth, endOfMonth, addDays, addMonths,
  getDaysInMonth, getYear, getMonth, getDate,
} from "date-fns-jalali";

const PERSIAN_MONTHS = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
const VALID_PRIORITIES = ["Low", "Normal", "High", "Urgent"];

async function getCurrentPersonnelId(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const user = await verifySession(token);
  if (!user) return null;
  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId }, select: { Personnel_ID: true } });
  return dbUser?.Personnel_ID ?? null;
}

// کلید یکتای روز شمسی: "y-m-d"
const dayKey = (d: Date) => `${getYear(d)}-${getMonth(d)}-${getDate(d)}`;

// ============================================================
//  ۱) داده‌های کامل یک ماه (شخصی + ابلاغیه + ماموریت + پروژه)
// ============================================================
export async function getMyAgendaMonth(jYearParam?: number, jMonthParam?: number) {
  const personnelId = await getCurrentPersonnelId();
  if (!personnelId) return null;

  const now = new Date();
  const hasValid = typeof jYearParam === "number" && !isNaN(jYearParam) &&
    typeof jMonthParam === "number" && jMonthParam >= 0 && jMonthParam <= 11;
  const targetJY = hasValid ? jYearParam! : getYear(now);
  const targetJM = hasValid ? jMonthParam! : getMonth(now);

  let monthStart = startOfMonth(now);
  const diff = (targetJY - getYear(now)) * 12 + (targetJM - getMonth(now));
  if (diff !== 0) monthStart = addMonths(monthStart, diff);

  const monthEnd = endOfMonth(monthStart);
  monthEnd.setHours(23, 59, 59, 999);

  const [agendaItems, tasks, missions, holidays, assignments] = await Promise.all([
    prisma.pR_Personal_Agenda.findMany({
      where: { Personnel_ID: personnelId, Event_Date: { gte: monthStart, lte: monthEnd } },
      orderBy: [{ Event_Date: "asc" }, { Start_Time: "asc" }],
    }),
    prisma.pR_Tasks.findMany({
      where: { Assigned_To: personnelId, Due_Date: { gte: monthStart, lte: monthEnd }, Status: { in: ["Pending", "Submitted", "Approved"] } },
      orderBy: { Created_At: "desc" },
    }),
    prisma.pR_Commute_Logs.findMany({
      where: { Personnel_ID: personnelId, Commute_Date: { gte: monthStart, lte: monthEnd }, Status: { in: ["Pending", "InProgress", "Completed"] } },
      orderBy: { Commute_Date: "asc" },
    }),
    prisma.pR_Holidays.findMany({ where: { Date: { gte: monthStart, lte: monthEnd } } }),
    // ✅ جدید: پروژه‌های من برای رویدادهای شروع/پایان/طلایی/مهلت
    prisma.pR_Project_Assignments.findMany({
      where: { Personnel_ID: personnelId, Is_Active: true },
      include: { PR_Projects: true },
    }),
  ]);

  const agendaMap: any = {}, taskMap: any = {}, missionMap: any = {}, holidayMap: any = {}, projectMap: any = {};
  agendaItems.forEach((a: any) => { const k = dayKey(new Date(a.Event_Date)); (agendaMap[k] ||= []).push(a); });
  tasks.forEach((t: any) => { if (t.Due_Date) { const k = dayKey(new Date(t.Due_Date)); (taskMap[k] ||= []).push(t); } });
  missions.forEach((m: any) => { const k = dayKey(new Date(m.Commute_Date)); (missionMap[k] ||= []).push(m); });
  holidays.forEach((h: any) => { holidayMap[dayKey(new Date(h.Date))] = h.Description || "تعطیل رسمی"; });

  // ✅ رویدادهای پروژه‌ها
  const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
  assignments.forEach((a: any) => {
    const p = a.PR_Projects;
    if (!p) return;

    const addEvent = (dateVal: any, kind: string) => {
      if (!dateVal) return;
      const k = dayKey(new Date(dateVal));
      (projectMap[k] ||= []).push({ Project_ID: p.Project_ID, Project_Name: p.Project_Name, Kind: kind, Overdue_Days: null });
    };

    addEvent(p.Start_Date, "start");
    addEvent(p.Golden_Date, "golden");
    addEvent(p.End_Date, "end");

    // مهلت تحویل — اگر پروژه تمام نشده و مهلت گذشته باشد → دیرکرد (تعداد روز)
    if (p.Deadline_Date) {
      const dl = new Date(p.Deadline_Date);
      dl.setHours(0, 0, 0, 0);
      const overdueDays = p.Status !== "Completed"
        ? Math.max(0, Math.floor((todayMid.getTime() - dl.getTime()) / 86400000))
        : 0;
      const k = dayKey(dl);
      (projectMap[k] ||= []).push({
        Project_ID: p.Project_ID,
        Project_Name: p.Project_Name,
        Kind: "deadline",
        Overdue_Days: overdueDays > 0 ? overdueDays : null,
      });
    }
  });

  const todayKey = dayKey(now);
  const offset = (monthStart.getDay() + 1) % 7; // شنبه = ۰

  const days = [];
  const totalDays = getDaysInMonth(monthStart);
  for (let i = 0; i < totalDays; i++) {
    const d = addDays(monthStart, i);
    d.setHours(12, 0, 0, 0);
    const k = dayKey(d);
    days.push({
      dateISO: d.toISOString(),
      jDay: getDate(d),
      isFriday: d.getDay() === 5,
      isHoliday: !!holidayMap[k],
      holidayDesc: holidayMap[k] || null,
      isToday: k === todayKey,
      agenda: agendaMap[k] || [],
      tasks: taskMap[k] || [],
      missions: missionMap[k] || [],
      projectEvents: projectMap[k] || [], // ✅ جدید
    });
  }

  const projectEventCount = Object.values(projectMap).reduce((s: number, arr: any) => s + arr.length, 0);

  return JSON.parse(JSON.stringify({
    jYear: targetJY,
    jMonth: targetJM,
    monthLabel: `${PERSIAN_MONTHS[targetJM]} ${targetJY}`,
    offset,
    days,
    stats: {
      agendaCount: agendaItems.length,
      doneCount: agendaItems.filter((a: any) => a.Is_Done).length,
      taskCount: tasks.length,
      missionCount: missions.length,
      projectEventCount, // ✅ جدید
    },
  }));
}

// ============================================================
//  ۲) ثبت آیتم جدید — ساعت به فرمت "HH:mm" (۲۴ ساعته)
// ============================================================
export async function createAgendaItemAction(formData: FormData) {
  const personnelId = await getCurrentPersonnelId();
  if (!personnelId) return { error: "نشست نامعتبر است" };

  const title = (formData.get("title") as string)?.trim();
  const dateISO = formData.get("eventDate") as string;
  if (!title) return { error: "عنوان الزامی است" };
  if (!dateISO) return { error: "تاریخ نامعتبر است" };

  const eventDate = new Date(dateISO);
  if (isNaN(eventDate.getTime())) return { error: "تاریخ نامعتبر است" };
  eventDate.setHours(12, 0, 0, 0);

  const priority = VALID_PRIORITIES.includes(formData.get("priority") as string) ? (formData.get("priority") as string) : "Normal";

  // اعتبارسنجی سمت سرور: فقط "HH:mm" با ساعت ۰۰-۲۳ و دقیقه ۰۰-۵۹
  const timeRe = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const rawStart = ((formData.get("startTime") as string) || "").trim();
  const rawEnd = ((formData.get("endTime") as string) || "").trim();
  if (rawStart && !timeRe.test(rawStart)) return { error: "ساعت شروع نامعتبر است (فرمت ۲۴ ساعته HH:mm)" };
  if (rawEnd && !timeRe.test(rawEnd)) return { error: "ساعت پایان نامعتبر است (فرمت ۲۴ ساعته HH:mm)" };

  const description = ((formData.get("description") as string) || "").trim() || null;

  try {
    await prisma.pR_Personal_Agenda.create({
      data: { Personnel_ID: personnelId, Event_Date: eventDate, Title: title, Description: description, Priority: priority, Start_Time: rawStart || null, End_Time: rawEnd || null },
    });
  } catch (error: any) {
    return { error: `خطا در ثبت: ${error.message}` };
  }

  revalidatePath("/dashboard/my-agenda");
  return { success: true };
}

// ============================================================
//  ۳) ویرایش آیتم
// ============================================================
export async function updateAgendaItemAction(formData: FormData) {
  const personnelId = await getCurrentPersonnelId();
  if (!personnelId) return { error: "نشست نامعتبر است" };

  const agendaId = parseInt(formData.get("agendaId") as string);
  if (isNaN(agendaId)) return { error: "شناسه نامعتبر است" };

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "عنوان الزامی است" };

  const item = await prisma.pR_Personal_Agenda.findUnique({ where: { Agenda_ID: agendaId } });
  if (!item) return { error: "آیتم یافت نشد" };
  if (item.Personnel_ID !== personnelId) return { error: "این آیتم متعلق به شما نیست" };

  const priority = VALID_PRIORITIES.includes(formData.get("priority") as string) ? (formData.get("priority") as string) : "Normal";

  const timeRe = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const rawStart = ((formData.get("startTime") as string) || "").trim();
  const rawEnd = ((formData.get("endTime") as string) || "").trim();
  if (rawStart && !timeRe.test(rawStart)) return { error: "ساعت شروع نامعتبر است (فرمت ۲۴ ساعته HH:mm)" };
  if (rawEnd && !timeRe.test(rawEnd)) return { error: "ساعت پایان نامعتبر است (فرمت ۲۴ ساعته HH:mm)" };

  const description = ((formData.get("description") as string) || "").trim() || null;

  try {
    await prisma.pR_Personal_Agenda.update({
      where: { Agenda_ID: agendaId },
      data: { Title: title, Description: description, Priority: priority, Start_Time: rawStart || null, End_Time: rawEnd || null },
    });
  } catch (error: any) {
    return { error: `خطا در ویرایش: ${error.message}` };
  }

  revalidatePath("/dashboard/my-agenda");
  return { success: true };
}

// ============================================================
//  ۴) تیک انجام‌شده / برگشت (دست نخورده)
// ============================================================
export async function toggleAgendaDoneAction(formData: FormData) {
  const personnelId = await getCurrentPersonnelId();
  if (!personnelId) return { error: "نشست نامعتبر است" };

  const agendaId = parseInt(formData.get("agendaId") as string);
  if (isNaN(agendaId)) return { error: "شناسه نامعتبر است" };

  const item = await prisma.pR_Personal_Agenda.findUnique({ where: { Agenda_ID: agendaId } });
  if (!item) return { error: "آیتم یافت نشد" };
  if (item.Personnel_ID !== personnelId) return { error: "این آیتم متعلق به شما نیست" };

  await prisma.pR_Personal_Agenda.update({
    where: { Agenda_ID: agendaId },
    data: { Is_Done: !item.Is_Done, Completed_At: !item.Is_Done ? new Date() : null },
  });

  revalidatePath("/dashboard/my-agenda");
  return { success: true };
}

// ============================================================
//  ۵) حذف آیتم (دست نخورده)
// ============================================================
export async function deleteAgendaItemAction(formData: FormData) {
  const personnelId = await getCurrentPersonnelId();
  if (!personnelId) return { error: "نشست نامعتبر است" };

  const agendaId = parseInt(formData.get("agendaId") as string);
  if (isNaN(agendaId)) return { error: "شناسه نامعتبر است" };

  const item = await prisma.pR_Personal_Agenda.findUnique({ where: { Agenda_ID: agendaId } });
  if (!item) return { error: "آیتم یافت نشد" };
  if (item.Personnel_ID !== personnelId) return { error: "این آیتم متعلق به شما نیست" };

  await prisma.pR_Personal_Agenda.delete({ where: { Agenda_ID: agendaId } });

  revalidatePath("/dashboard/my-agenda");
  return { success: true };
}