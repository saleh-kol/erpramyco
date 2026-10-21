"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

// ============================================================
//  ابزارهای مشترک
// ============================================================
async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return await verifySession(token);
}

async function getCurrentPersonnelId(): Promise<number | null> {
  const user = await getSession();
  if (!user) return null;
  const dbUser = await prisma.users.findUnique({
    where: { User_ID: user.userId },
    select: { Personnel_ID: true },
  });
  return dbUser?.Personnel_ID ?? null;
}

async function isCurrentUserCEO(): Promise<boolean> {
  const user = await getSession();
  if (!user) return false;
  const dbUser = await prisma.users.findUnique({
    where: { User_ID: user.userId },
    include: { Personnel: { select: { Role: true } } },
  });
  return dbUser?.Personnel?.Role === "CEO";
}

/** زیرمجموعه‌های مستقیم (برای CEO: پرسنل بدون رکورد سرپرستی) */
async function getDirectSubordinateIds(personnelId: number): Promise<number[]> {
  const isCEO = await isCurrentUserCEO();

  if (isCEO) {
    const assigned = await prisma.pR_Supervision.findMany({ select: { Personnel_ID: true } });
    const assignedSet = new Set(assigned.map((a) => a.Personnel_ID));
    const candidates = await prisma.personnel.findMany({
      where: { IsActive: true, Role: { not: "CEO" } },
      select: { Personnel_ID: true },
    });
    return candidates.filter((c) => !assignedSet.has(c.Personnel_ID)).map((c) => c.Personnel_ID);
  }

  const rows = await prisma.pR_Supervision.findMany({
    where: { Supervisor_ID: personnelId },
    include: { Personnel: { select: { IsActive: true } } },
  });
  return rows.filter((r) => r.Personnel?.IsActive).map((r) => r.Personnel_ID);
}

const calcDays = (r: any) => {
  const s = new Date(r.Start_Date);
  const e = new Date(r.End_Date);
  const diff = Math.abs(e.getTime() - s.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
};

// ============================================================
//  ۱. انواع مرخصی برای فرم
// ============================================================
export async function getLeaveTypes() {
  const types = await prisma.pR_Leave_Types.findMany({ where: { Is_Active: true } });
  return JSON.parse(JSON.stringify(types));
}

// ============================================================
//  ۲. تاریخچه مرخصی‌های کاربر فعلی
// ============================================================
export async function getMyLeaveRequests(startDate?: string, endDate?: string) {
  const user = await getSession();
  if (!user) return [];

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return [];

  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(end.getDate() - 7));

  const requests = await prisma.pR_Leave_Requests.findMany({
    where: {
      Personnel_ID: dbUser.Personnel_ID,
      Requested_At: { gte: start, lte: end },
    },
    include: { PR_Leave_Types: true },
    orderBy: { Requested_At: "desc" },
  });

  const mapped = requests.map((r: any) => ({ ...r, Days_Count: calcDays(r) }));
  return JSON.parse(JSON.stringify(mapped));
}

// ============================================================
//  ۳. ثبت درخواست مرخصی جدید
// ============================================================
export async function createLeaveRequestAction(formData: FormData) {
  const user = await getSession();
  if (!user) return { error: "نشست نامعتبر است" };

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return { error: "پروفایل پرسنلی یافت نشد" };

  const leaveTypeName = ((formData.get("leaveTypeName") as string) || "").trim();
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const reason = formData.get("reason") as string;

  if (!leaveTypeName) return { error: "نوع مرخصی الزامی است" };

  try {
    let leaveType = await prisma.pR_Leave_Types.findFirst({
      where: { Leave_Type_Name: leaveTypeName },
    });

    if (!leaveType) {
      leaveType = await prisma.pR_Leave_Types.create({
        data: { Leave_Type_Code: `L-${Date.now()}`, Leave_Type_Name: leaveTypeName, Is_Paid: true },
      });
    }

    await prisma.pR_Leave_Requests.create({
      data: {
        Personnel_ID: dbUser.Personnel_ID,
        Leave_Type_ID: leaveType.Leave_Type_ID,
        Start_Date: new Date(startDate),
        End_Date: new Date(endDate),
        Reason: reason,
        Status: "Pending",
        Requested_At: new Date(),
      },
    });
    revalidatePath("/dashboard/leave");
    revalidatePath("/dashboard/leave-approvals");
    return { success: true };
  } catch (error: any) {
    return { error: `خطا در ثبت مرخصی: ${error.message}` };
  }
}

// ============================================================
//  ۴. درخواست‌های برای من — فیلتر سلسله‌مراتبی
// ============================================================
export async function getAllLeaveRequests(status: string = "Pending") {
  const me = await getCurrentPersonnelId();
  if (!me) return [];

  const mySubIds = await getDirectSubordinateIds(me);

  const whereClause: any = {};
  if (status !== "All") {
    whereClause.Status = status;
  }

  // زیرمجموعه‌های مستقیم من + مواردی که خودم بررسی کرده‌ام
  whereClause.OR = [
    ...(mySubIds.length > 0 ? [{ Personnel_ID: { in: mySubIds } }] : []),
    { Approved_By: me },
  ];

  const requests = await prisma.pR_Leave_Requests.findMany({
    where: whereClause,
    include: {
      Personnel_PR_Leave_Requests_Personnel_IDToPersonnel: true,
      PR_Leave_Types: true,
    },
    orderBy: { Requested_At: "desc" },
  });

  const mapped = requests.map((r: any) => ({ ...r, Days_Count: calcDays(r) }));
  return JSON.parse(JSON.stringify(mapped));
}

// ============================================================
//  ۵. تایید/رد — گارد سرپرست مستقیم + فیکس Approved_By
// ============================================================
export async function reviewLeaveRequestAction(formData: FormData) {
  const leaveId = parseInt(formData.get("leaveId") as string);
  const action = formData.get("action") as string;

  if (isNaN(leaveId)) return { error: "شناسه درخواست نامعتبر است" };
  if (action !== "approve" && action !== "reject") return { error: "عملیات نامعتبر است" };

  const me = await getCurrentPersonnelId();
  if (!me) return { error: "نشست نامعتبر است" };

  const request = await prisma.pR_Leave_Requests.findUnique({
    where: { Leave_ID: leaveId },
  });
  if (!request) return { error: "درخواست مرخصی یافت نشد" };
  if (request.Status !== "Pending") {
    return { error: "این درخواست قبلاً بررسی شده است" };
  }

  // گارد: فقط سرپرست مستقیم مخاطب (یا CEO اگر مخاطب بدون سرپرست است)
  const supRec = await prisma.pR_Supervision.findUnique({
    where: { Personnel_ID: request.Personnel_ID },
    select: { Supervisor_ID: true },
  });

  if (supRec) {
    if (supRec.Supervisor_ID !== me) {
      return { error: "فقط سرپرست مستقیم کارمند می‌تواند این درخواست را بررسی کند" };
    }
  } else {
    const isCEO = await isCurrentUserCEO();
    if (!isCEO) {
      return { error: "بررسی این درخواست فقط توسط مدیرعامل امکان‌پذیر است" };
    }
  }

  try {
    await prisma.pR_Leave_Requests.update({
      where: { Leave_ID: leaveId },
      data: {
        Status: action === "approve" ? "Approved" : "Rejected",
        Approved_By: me, // Personnel_ID — نه User_ID
        Approved_At: new Date(),
      },
    });
  } catch (error: any) {
    return { error: `خطا: ${error.message}` };
  }

  revalidatePath("/dashboard/leave-approvals");
  revalidatePath("/dashboard/leave");
  return { success: true };
}

// ============================================================
//  ۶. ⭐ نوتیفیکیشن‌ها — با سلسله‌مراتب (export گم‌شده)
// ============================================================
export async function getMyNotifications() {
  const user = await getSession();
  if (!user) return [];

  const dbUser = await prisma.users.findUnique({
    where: { User_ID: user.userId },
    include: { Personnel: { select: { Personnel_ID: true, Role: true } } },
  });
  // فیکس: نقش از Personnel — نه user.role (که همیشه undefined بود)
  if (!dbUser?.Personnel_ID || !dbUser.Personnel) return [];

  const me = dbUser.Personnel_ID;
  const isCEO = dbUser.Personnel.Role === "CEO";

  let notifications: any[] = [];

  // ---------- اعلان‌های «در انتظار» برای مدیرعامل و سرپرست‌ها ----------
  const mySubIds = await getDirectSubordinateIds(me);

  if (mySubIds.length > 0) {
    // مرخصی‌های در انتظار زیرمجموعه‌ها
    const pendingLeaves = await prisma.pR_Leave_Requests.findMany({
      where: { Status: "Pending", Personnel_ID: { in: mySubIds } },
      include: { Personnel_PR_Leave_Requests_Personnel_IDToPersonnel: true },
      orderBy: { Requested_At: "desc" },
      take: 5,
    });
    notifications.push(...pendingLeaves.map((p: any) => ({
      id: `leave-${p.Leave_ID}`,
      text: `درخواست مرخصی از ${p.Personnel_PR_Leave_Requests_Personnel_IDToPersonnel?.Full_Name}`,
      time: p.Requested_At,
      type: "pending",
      link: "/dashboard/leave-approvals",
    })));

    // ماموریت‌های در انتظار زیرمجموعه‌ها
    const pendingMissions = await prisma.pR_Commute_Logs.findMany({
      where: { Status: "Pending", Personnel_ID: { in: mySubIds } },
      include: { Personnel_PR_Commute_Logs_Personnel_IDToPersonnel: true },
      orderBy: { Commute_Date: "desc" },
      take: 5,
    });
    notifications.push(...pendingMissions.map((m: any) => ({
      id: `mission-pending-${m.Commute_ID}`,
      text: `درخواست ماموریت از ${m.Personnel_PR_Commute_Logs_Personnel_IDToPersonnel?.Full_Name}`,
      time: m.Commute_Date,
      type: "pending",
      link: "/dashboard/leave-approvals",
    })));

    // پروژه‌های OnHold که مسئولشان زیرمجموعه من است
    const pendingProjects = await prisma.pR_Projects.findMany({
      where: { Status: "OnHold", Project_Leader_ID: { in: mySubIds } },
      orderBy: { Updated_At: "desc" },
      take: 5,
    });
    notifications.push(...pendingProjects.map((p: any) => ({
      id: `proj-pending-${p.Project_ID}`,
      text: `درخواست اتمام پروژه: ${p.Project_Name}`,
      time: p.Updated_At,
      type: "pending",
      link: "/dashboard/leave-approvals",
    })));

    // ابلاغیه‌های Submitted زیرمجموعه‌ها
    const submittedTasks = await prisma.pR_Tasks.findMany({
      where: { Status: "Submitted", Assigned_To: { in: mySubIds } },
      include: { Personnel_AssignedTo: true },
      orderBy: { Updated_At: "desc" },
      take: 5,
    });
    notifications.push(...submittedTasks.map((t: any) => ({
      id: `task-submitted-${t.Task_ID}`,
      text: `ابلاغیه انجام شده توسط ${t.Personnel_AssignedTo?.Full_Name || "کارمند"} در انتظار تایید است`,
      time: t.Updated_At,
      type: "pending",
      link: "/dashboard/tasks",
    })));
  }

  // فقط CEO: پرسنل جدید در انتظار تایید
  if (isCEO) {
    const pendingPersonnel = await prisma.personnel.findMany({ where: { IsApproved: false }, take: 5 });
    notifications.push(...pendingPersonnel.map((p: any) => ({
      id: `pers-pending-${p.Personnel_ID}`,
      text: `پرسنل جدید در انتظار تایید: ${p.Full_Name}`,
      time: new Date(),
      type: "pending",
      link: "/dashboard/personnel",
    })));
  }

  // ---------- اعلان‌های «پردازش‌شده» شخصی برای همه ----------
  const processed = await prisma.pR_Leave_Requests.findMany({
    where: { Personnel_ID: me, Status: { in: ["Approved", "Rejected"] }, Approved_At: { not: null } },
    orderBy: { Approved_At: "desc" },
    take: 5,
  });
  notifications.push(...processed.map((p: any) => ({
    id: `leave-${p.Leave_ID}`,
    text: `درخواست مرخصی شما ${p.Status === "Approved" ? "تایید" : "رد"} شد`,
    time: p.Approved_At,
    type: p.Status === "Approved" ? "approved" : "rejected",
    link: "/dashboard/leave",
  })));

  const myProjectAssignments = await prisma.pR_Project_Assignments.findMany({
    where: { Personnel_ID: me, Is_Active: true },
    include: { PR_Projects: true },
  });
  const recentProjects = myProjectAssignments
    .map((a: any) => a.PR_Projects)
    .filter((p: any) => p.Status === "Completed" || p.Status === "Cancelled");
  notifications.push(...recentProjects.map((p: any) => ({
    id: `proj-status-${p.Project_ID}`,
    text: p.Status === "Completed"
      ? `پروژه "${p.Project_Name}" تایید شد! پاداش شما: ${Number(p.Final_Bonus || 0).toLocaleString("fa-IR")} ریال`
      : `پروژه "${p.Project_Name}" به دلیل دیرکرد لغو شد`,
    time: p.Updated_At,
    type: p.Status === "Completed" ? "approved" : "rejected",
    link: "/dashboard/my-projects",
  })));

  const taskUpdates = await prisma.pR_Tasks.findMany({
    where: { Assigned_To: me, Status: "Approved" },
    orderBy: { Updated_At: "desc" },
    take: 5,
  });
  notifications.push(...taskUpdates.map((t: any) => ({
    id: `task-approved-${t.Task_ID}`,
    text: `ابلاغیه "${t.Title}" توسط سرپرست تایید شد`,
    time: t.Updated_At,
    type: "approved",
    link: "/dashboard/my-tasks",
  })));

  const processedMissions = await prisma.pR_Commute_Logs.findMany({
    where: { Personnel_ID: me, Status: { in: ["InProgress", "Rejected"] } },
    orderBy: { Approved_At: "desc" },
    take: 5,
  });
  notifications.push(...processedMissions.map((m: any) => ({
    id: `mission-status-${m.Commute_ID}`,
    text: `درخواست ماموریت شما ${m.Status === "InProgress" ? "تایید شد و در حال انجام است" : "رد شد"}`,
    time: m.Approved_At,
    type: m.Status === "InProgress" ? "approved" : "rejected",
    link: "/dashboard/my-missions",
  })));

  // مرتب‌سازی + حذف تکراری + ۵ مورد اخیر
  notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const unique = notifications.filter((n: any, i: number, self: any[]) =>
    i === self.findIndex((x: any) => x.id === n.id)
  );
  return JSON.parse(JSON.stringify(unique.slice(0, 5)));
}