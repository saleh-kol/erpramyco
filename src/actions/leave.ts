"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

// تابع کمکی مشترک برای خواندن سشن
async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return await verifySession(token);
}

// ۱. گرفتن لیست انواع مرخصی برای فرم
export async function getLeaveTypes() {
  const types = await prisma.pR_Leave_Types.findMany({
    where: { Is_Active: true },
  });
  return JSON.parse(JSON.stringify(types));
}

// ۲. گرفتن تاریخچه مرخصی‌های کاربر فعلی
export async function getMyLeaveRequests(startDate?: string, endDate?: string) {
  const user = await getSession();
  if (!user) return [];

  const dbUser = await prisma.users.findUnique({
    where: { User_ID: user.userId },
  });
  if (!dbUser || !dbUser.Personnel_ID) return [];

  let end = endDate ? new Date(endDate) : new Date();
  let start = startDate
    ? new Date(startDate)
    : new Date(new Date().setDate(end.getDate() - 7));

  const requests = await prisma.pR_Leave_Requests.findMany({
    where: {
      Personnel_ID: dbUser.Personnel_ID,
      Requested_At: { gte: start, lte: end },
    },
    include: { PR_Leave_Types: true },
    orderBy: { Requested_At: "desc" },
  });
  return JSON.parse(JSON.stringify(requests));
}

// ۳. ثبت درخواست مرخصی جدید
export async function createLeaveRequestAction(formData: FormData) {
  const user = await getSession();
  if (!user) return { error: "نشست نامعتبر است" };

  const dbUser = await prisma.users.findUnique({
    where: { User_ID: user.userId },
  });
  if (!dbUser || !dbUser.Personnel_ID)
    return { error: "پروفایل پرسنلی یافت نشد" };

  const leaveTypeId = parseInt(formData.get("leaveTypeId") as string);
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const reason = formData.get("reason") as string;

  try {
    await prisma.pR_Leave_Requests.create({
      data: {
        Personnel_ID: dbUser.Personnel_ID,
        Leave_Type_ID: leaveTypeId,
        Start_Date: new Date(startDate),
        End_Date: new Date(endDate),
        Reason: reason,
        Status: "Pending",
        Requested_At: new Date(),
      },
    });
    revalidatePath("/dashboard/leave");
    return { success: true };
  } catch (error: any) {
    return { error: `خطا در ثبت مرخصی: ${error.message}` };
  }
}

// ۴. گرفتن همه درخواست‌ها برای مدیر کارخانه
export async function getAllLeaveRequests(status: string = 'Pending') {
  let whereClause: any = {};
  
  if (status !== 'All') {
    whereClause.Status = status;
  }

  const requests = await prisma.pR_Leave_Requests.findMany({
    where: whereClause,
    include: {
      Personnel_PR_Leave_Requests_Personnel_IDToPersonnel: true,
      PR_Leave_Types: true,
    },
    orderBy: { Requested_At: "desc" },
  });

  return JSON.parse(JSON.stringify(requests));
}

// ۵. تایید یا رد درخواست توسط مدیر
export async function reviewLeaveRequestAction(formData: FormData) {
  const leaveId = parseInt(formData.get("leaveId") as string);
  const action = formData.get("action") as string;
  const newStatus = action === "approve" ? "Approved" : "Rejected";

  const user = await getSession();
  if (!user) return { error: "نشست نامعتبر است" };

  try {
    await prisma.pR_Leave_Requests.update({
      where: { Leave_ID: leaveId },
      data: {
        Status: newStatus,
        Approved_By: user.userId,
        Approved_At: new Date(),
      },
    });
  } catch (error: any) {
    return { error: `خطا: ${error.message}` };
  }

  revalidatePath("/dashboard/leave-approvals");
  return { success: true };
}

// ۶. گرفتن نوتیفیکیشن‌ها برای زنگوله
export async function getMyNotifications() {
  const user = await getSession();
  if (!user) return [];
  
  const dbUser = await prisma.users.findUnique({
    where: { User_ID: user.userId },
  });
  if (!dbUser || !dbUser.Personnel_ID) return [];

  let notifications: any[] = [];

  // ۱. نوتیف‌های مربوط به مرخصی و پروژه برای مدیر
  if (user.role === "مدیر کارخانه") {
    const pending = await prisma.pR_Leave_Requests.findMany({
      where: { Status: "Pending" },
      include: { Personnel_PR_Leave_Requests_Personnel_IDToPersonnel: true },
      orderBy: { Requested_At: "desc" },
      take: 5,
    });
    notifications = pending.map((p) => ({
      id: `leave-${p.Leave_ID}`,
      text: `درخواست مرخصی از ${p.Personnel_PR_Leave_Requests_Personnel_IDToPersonnel?.Full_Name}`,
      time: p.Requested_At,
      type: "pending",
      link: "/dashboard/leave-approvals",
    }));

    // درخواست‌های اتمام پروژه برای مدیر
    const pendingProjects = await prisma.pR_Projects.findMany({
      where: { Status: "OnHold" },
      orderBy: { Updated_At: "desc" },
      take: 5,
    });
    const projectNotifs = pendingProjects.map((p) => ({
      id: `proj-pending-${p.Project_ID}`,
      text: `درخواست اتمام پروژه: ${p.Project_Name}`,
      time: p.Updated_At,
      type: "pending",
      link: "/dashboard/leave-approvals",
    }));
    notifications = [...notifications, ...projectNotifs];

    // درخواست‌های ماموریت برای مدیر
    const pendingMissions = await prisma.pR_Commute_Logs.findMany({
      where: { Status: "Pending" },
      include: { Personnel_PR_Commute_Logs_Personnel_IDToPersonnel: true },
      orderBy: { Commute_Date: "desc" },
      take: 5,
    });
    const missionNotifs = pendingMissions.map((m) => ({
      id: `mission-pending-${m.Commute_ID}`,
      text: `درخواست ماموریت از ${m.Personnel_PR_Commute_Logs_Personnel_IDToPersonnel?.Full_Name}`,
      time: m.Commute_Date,
      type: "pending",
      link: "/dashboard/leave-approvals",
    }));
    notifications = [...notifications, ...missionNotifs];
  } else {
    // ۲. نوتیف‌های مرخصی برای کارمند
    const processed = await prisma.pR_Leave_Requests.findMany({
      where: {
        Personnel_ID: dbUser.Personnel_ID,
        Status: { in: ["Approved", "Rejected"] },
        Approved_At: { not: null },
      },
      orderBy: { Approved_At: "desc" },
      take: 5,
    });
    notifications = processed.map((p) => ({
      id: `leave-${p.Leave_ID}`,
      text: `درخواست مرخصی شما ${p.Status === "Approved" ? "تایید" : "رد"} شد`,
      time: p.Approved_At,
      type: p.Status === "Approved" ? "approved" : "rejected",
      link: "/dashboard/leave",
    }));

    // ۳. وضعیت پروژه‌های کارمند
    const myProjectAssignments = await prisma.pR_Project_Assignments.findMany({
      where: { Personnel_ID: dbUser.Personnel_ID, Is_Active: true },
      include: { PR_Projects: true },
    });

    const recentProjects = myProjectAssignments
      .map((a) => a.PR_Projects)
      .filter((p) => p.Status === "Completed" || p.Status === "Cancelled");

    const projNotifs = recentProjects.map((p) => ({
      id: `proj-status-${p.Project_ID}`,
      text:
        p.Status === "Completed"
          ? `پروژه "${p.Project_Name}" تایید شد! پاداش: ${Number(p.Final_Bonus || 0).toLocaleString("fa-IR")} ریال`
          : `پروژه "${p.Project_Name}" به دلیل دیرکرد لغو شد`,
      time: p.Updated_At,
      type: p.Status === "Completed" ? "approved" : "rejected",
      link: "/dashboard/my-projects",
    }));
    notifications = [...notifications, ...projNotifs];

    // ۴. ابلاغیه‌های جدید برای کارمند
    const pendingTasks = await prisma.pR_Tasks.findMany({
      where: { Assigned_To: dbUser.Personnel_ID, Status: "Pending" },
      orderBy: { Created_At: "desc" },
      take: 5,
    });

    const taskNotifs = pendingTasks.map((t) => ({
      id: `task-${t.Task_ID}`,
      text: `ابلاغیه جدید: ${t.Title}`,
      time: t.Created_At,
      type: "task",
      link: "/dashboard/my-tasks",
    }));
    notifications = [...notifications, ...taskNotifs];

    // ۵. وضعیت ماموریت‌های کارمند
    const processedMissions = await prisma.pR_Commute_Logs.findMany({
      where: {
        Personnel_ID: dbUser.Personnel_ID,
        Status: { in: ["InProgress", "Rejected"] },
      },
      orderBy: { Approved_At: "desc" },
      take: 5,
    });
    const procMissionNotifs = processedMissions.map((m) => ({
      id: `mission-status-${m.Commute_ID}`,
      text: `درخواست ماموریت شما ${m.Status === "InProgress" ? "تایید شد و در حال انجام است" : "رد شد"}`,
      time: m.Approved_At,
      type: m.Status === "InProgress" ? "approved" : "rejected",
      link: "/dashboard/my-missions",
    }));
    notifications = [...notifications, ...procMissionNotifs];
  }

  // مرتب‌سازی تمام نوتیف‌ها بر اساس زمان (جدیدترین‌ها بالا)
  notifications.sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  );

  // حذف نوتیف‌های تکراری بر اساس id
  const uniqueNotifications = notifications.filter((notif, index, self) =>
    index === self.findIndex((n) => n.id === notif.id)
  );

  // برگرداندن ۵ نوتیف اخیر - این خط قبلا وجود نداشت!
  return JSON.parse(JSON.stringify(uniqueNotifications.slice(0, 5)));
}