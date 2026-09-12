"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

// ۱. گرفتن لیست ابلاغیه‌ها بر اساس وضعیت
export async function getTasks(status: string = 'Pending') {
  const tasks = await prisma.pR_Tasks.findMany({
    where: { Status: status },
    include: {
      Personnel_AssignedTo: true
    },
    orderBy: { Created_At: 'desc' }
  });
  return JSON.parse(JSON.stringify(tasks)); 
}

// ۲. گرفتن لیست پرسنل برای انتخاب در فرم
export async function getPersonnelForTask() {
  const personnel = await prisma.personnel.findMany({
    // اصلاح شد: Contractor حذف و CEO قرار داده شد
    where: { IsActive: true, Role: { not: 'CEO' } },
    select: { Personnel_ID: true, Full_Name: true, Personnel_Code: true, Role: true, Personal_Image_Path: true }
  });
  return JSON.parse(JSON.stringify(personnel));
}

// ۳. ثبت ابلاغیه جدید برای چند کارمند
export async function createTaskAction(formData: FormData): Promise<void> {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const dueDate = formData.get('dueDate') as string;
  const priority = formData.get('priority') as string;
  const personnelIds = formData.getAll('personnelId').map(id => parseInt(id as string));

  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  let managerId: number | null = null;

  if (session) {
    const user = await verifySession(session);
    if (user) {
      managerId = user.userId;
    }
  }

  try {
    if (personnelIds.length > 0) {
      await prisma.pR_Tasks.createMany({
        data: personnelIds.map(pId => ({
          Assigned_To: pId,
          Assigned_By: managerId ? Number(managerId) : 0,
          Title: title,
          Description: description,
          Due_Date: dueDate ? new Date(dueDate) : null,
          Priority: priority || 'Normal',
          Status: 'Pending'
        }))
      });
    }
  } catch (error: any) {
    console.error("خطا در ثبت ابلاغیه:", error.message);
  }

  revalidatePath('/dashboard/tasks');
}

// ۴. گرفتن ابلاغیه‌های کاربر فعلی
export async function getMyTasks() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return [];

  const user = await verifySession(session); 
  if (!user) return []; 
  
  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return [];

  const tasks = await prisma.pR_Tasks.findMany({
    where: { Assigned_To: dbUser.Personnel_ID },
    orderBy: { Created_At: 'desc' }
  });
  return JSON.parse(JSON.stringify(tasks));
}

// ۵. علامت زدن ابلاغیه به عنوان انجام شده
export async function completeTaskAction(formData: FormData): Promise<void> {
  const taskId = parseInt(formData.get('taskId') as string);

  try {
    await prisma.pR_Tasks.update({
      where: { Task_ID: taskId },
      data: { Status: 'Done' }
    });
  } catch (error: any) {
    console.error("خطا در بروزرسانی وضعیت ابلاغیه:", error.message);
  }

  revalidatePath('/dashboard/my-tasks');
}