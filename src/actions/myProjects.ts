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

// ۱. گرفتن پروژه‌های کاربر فعلی
export async function getMyProjects(status: string = 'Active') {
  const user = await getSession();
  if (!user) return [];

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return [];

  const assignments = await prisma.pR_Project_Assignments.findMany({
    where: { Personnel_ID: dbUser.Personnel_ID, PR_Projects: { Status: status as any } },
    include: { PR_Projects: true },
    orderBy: { Assigned_From: 'desc' }
  });

  const projectsWithRole = assignments.map(a => ({
    ...a.PR_Projects,
    My_Role: a.Role_In_Project,
    Is_Leader: a.PR_Projects.Project_Leader_ID === dbUser.Personnel_ID
  }));

  return JSON.parse(JSON.stringify(projectsWithRole));
}

// ۲. درخواست اتمام پروژه توسط مسئول پروژه
export async function requestProjectCompletionAction(formData: FormData) {
  const projectId = parseInt(formData.get('projectId') as string);
  
  const user = await getSession();
  if (!user) return { error: "نشست نامعتبر است" };
  
  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  
  if (!dbUser || !dbUser.Personnel_ID) {
    return { error: "پروفایل پرسنلی یافت نشد" };
  }
  
  const project = await prisma.pR_Projects.findUnique({
    where: { Project_ID: projectId }
  });
  
  if (!project) return { error: "پروژه یافت نشد" };
  
  // اگر پروژه مسئول دارد و کاربر فعلی مسئول نیست
  if (project.Project_Leader_ID && dbUser.Personnel_ID !== project.Project_Leader_ID) {
    return { error: "فقط مسئول پروژه می‌تواند اتمام پروژه را ثبت کند" };
  }
  
  // چک اینکه پروژه در وضعیت Active باشد
  if (project.Status !== 'Active') {
    return { error: "این پروژه در وضعیت قابل اتمام نیست" };
  }
  
  // تغییر وضعیت به OnHold (در انتظار تایید مدیر)
  await prisma.pR_Projects.update({
    where: { Project_ID: projectId },
    data: { Status: 'OnHold' }
  });

  revalidatePath('/dashboard/my-projects');
  revalidatePath('/dashboard/leave-approvals');
  
  return { success: true };
}

// ۳. گرفتن درخواست‌های اتمام برای مدیر
export async function getProjectsForApproval(status: string = 'Pending') {
  let whereClause: any = {};
  
  if (status === 'Pending') whereClause.Status = 'OnHold';
  else if (status === 'Approved') whereClause.Status = 'Completed';
  else if (status === 'Rejected') whereClause.Status = 'Active';

  const projects = await prisma.pR_Projects.findMany({
    where: whereClause,
    include: { 
      PR_Project_Assignments: { include: { Personnel: true } },
      Project_Leader: true
    },
    orderBy: { Updated_At: 'desc' }
  });
  
  return JSON.parse(JSON.stringify(projects));
}

// ۴. تایید یا رد درخواست اتمام توسط مدیر (با محاسبه پاداش)
export async function reviewProjectCompletionAction(formData: FormData) {
  const projectId = parseInt(formData.get('projectId') as string);
  const action = formData.get('action') as string;

  const project = await prisma.pR_Projects.findUnique({
    where: { Project_ID: projectId }
  });

  if (!project) return { error: "پروژه یافت نشد" };

  if (action === 'approve') {
    const now = new Date();
    const goldenDate = project.Golden_Date ? new Date(project.Golden_Date) : null;
    const endDate = project.End_Date ? new Date(project.End_Date) : null;
    const deadlineDate = project.Deadline_Date ? new Date(project.Deadline_Date) : null;
    
    let finalBonus = 0;
    let bonusDescription = "";

    if (goldenDate && now <= goldenDate) {
      const bonusAmount = (Number(project.Budget) * Number(project.Golden_Bonus_Percent)) / 100;
      finalBonus = Number(project.Budget) + bonusAmount;
      bonusDescription = `پاداش طلایی: +${bonusAmount.toLocaleString('fa-IR')} ریال`;
    } else if (endDate && now <= endDate) {
      finalBonus = Number(project.Budget);
      bonusDescription = "تحویل به موقع";
    } else if (deadlineDate && now <= deadlineDate) {
      const penaltyAmount = (Number(project.Budget) * Number(project.Delay_Penalty_Percent)) / 100;
      finalBonus = Number(project.Budget) - penaltyAmount;
      bonusDescription = `جریمه دیرکرد: -${penaltyAmount.toLocaleString('fa-IR')} ریال`;
    } else {
      await prisma.pR_Projects.update({
        where: { Project_ID: projectId },
        data: { Status: 'Cancelled', Final_Bonus: 0 }
      });
      revalidatePath('/dashboard/leave-approvals');
      return { success: true, message: "پروژه به دلیل دیرکرد لغو شد" };
    }

    await prisma.pR_Projects.update({
      where: { Project_ID: projectId },
      data: { Status: 'Completed', Final_Bonus: finalBonus }
    });
    
    revalidatePath('/dashboard/leave-approvals');
    revalidatePath('/dashboard/my-projects');
    
    return { success: true, message: bonusDescription, bonus: finalBonus };
  } else {
    await prisma.pR_Projects.update({
      where: { Project_ID: projectId },
      data: { Status: 'Active' }
    });
    
    revalidatePath('/dashboard/leave-approvals');
    revalidatePath('/dashboard/my-projects');
    
    return { success: true };
  }
}