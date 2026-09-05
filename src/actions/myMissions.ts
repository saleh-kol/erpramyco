"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

// تابع کمکی مشترک
async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return await verifySession(token);
}

// ۱. گرفتن ماموریت‌های کاربر بر اساس وضعیت
export async function getMyMissions(status: string = 'pending') {
  const user = await getSession();
  if (!user) return [];

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return [];

  const statusMap: any = {
    pending: 'Pending',
    inprogress: 'InProgress',
    completed: 'Completed',
    rejected: 'Rejected'
  };

  const missions = await prisma.pR_Commute_Logs.findMany({
    where: { 
      Personnel_ID: dbUser.Personnel_ID,
      Status: statusMap[status] || 'Pending'
    },
    orderBy: { Commute_Date: 'desc' }
  });
  return JSON.parse(JSON.stringify(missions));
}

// ۲. ثبت درخواست ماموریت جدید
export async function createMyMissionAction(formData: FormData) {
  const user = await getSession();
  if (!user) return { error: "نشست نامعتبر است" };
  
  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return { error: "پروفایل پرسنلی یافت نشد" };

  const commuteDate = formData.get('commuteDate') as string;
  const commuteType = formData.get('commuteType') as string;
  const origin = formData.get('origin') as string;
  const destination = formData.get('destination') as string;
  const distanceKm = parseFloat(formData.get('distanceKm') as string);
  const amount = parseFloat(formData.get('amount') as string);
  const receiptNumber = formData.get('receiptNumber') as string;
  const description = formData.get('description') as string;

  try {
    await prisma.pR_Commute_Logs.create({
      data: {
        Personnel_ID: dbUser.Personnel_ID,
        Commute_Date: new Date(commuteDate),
        Commute_Type: commuteType as any,
        Origin: origin,
        Destination: destination,
        Distance_KM: distanceKm || 0,
        Amount: amount || 0,
        Receipt_Number: receiptNumber,
        Description: description,
        Is_Approved: false,
        Status: 'Pending'
      }
    });
    revalidatePath('/dashboard/my-missions');
    return { success: true };
  } catch (error: any) {
    return { error: `خطا در ثبت ماموریت: ${error.message}` };
  }
}

// ۳. اتمام ماموریت توسط کارمند
export async function completeMyMissionAction(formData: FormData) {
  const commuteId = parseInt(formData.get('commuteId') as string);

  await prisma.pR_Commute_Logs.update({
    where: { Commute_ID: commuteId },
    data: { Status: 'Completed' }
  });

  revalidatePath('/dashboard/my-missions');
}

// ۴. تایید یا رد درخواست ماموریت توسط مدیر
export async function reviewMissionRequestAction(formData: FormData) {
  const commuteId = parseInt(formData.get('commuteId') as string);
  const action = formData.get('action') as string;
  
  const user = await getSession();
  if (!user) return { error: "نشست نامعتبر است" };

  const newStatus = action === 'approve' ? 'InProgress' : 'Rejected';
  const isApproved = action === 'approve';

  await prisma.pR_Commute_Logs.update({
    where: { Commute_ID: commuteId },
    data: {
      Status: newStatus,
      Is_Approved: isApproved,
      Approved_At: new Date(),
      Approved_By: user.userId
    }
  });

  revalidatePath('/dashboard/leave-approvals');
  revalidatePath('/dashboard/my-missions');
  return { success: true };
}

// ۵. گرفتن درخواست‌های ماموریت برای مدیر
export async function getPendingMissions() {
  const missions = await prisma.pR_Commute_Logs.findMany({
    where: { Status: 'Pending' },
    include: { Personnel_PR_Commute_Logs_Personnel_IDToPersonnel: true },
    orderBy: { Commute_Date: 'desc' }
  });
  
  const mappedMissions = missions.map(m => ({
    ...m,
    Personnel: m.Personnel_PR_Commute_Logs_Personnel_IDToPersonnel
  }));

  return JSON.parse(JSON.stringify(mappedMissions));
}