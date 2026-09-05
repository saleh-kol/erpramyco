"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session"; // <--- اضافه شد

// ۱. گرفتن لیست پروژه‌ها بر اساس وضعیت
export async function getProjects(status: 'Active' | 'Completed' | 'Cancelled' | 'OnHold' = 'Active') {
  const projects = await prisma.pR_Projects.findMany({
    where: { Status: status },
    include: {
      PR_Project_Assignments: {
        include: {
          Personnel: true
        }
      }
    },
    orderBy: { Created_At: 'desc' }
  });
  return JSON.parse(JSON.stringify(projects));
}

// ۲. گرفتن لیست پرسنل برای انتخاب در فرم (اضافه شدن فیلد عکس)
export async function getPersonnelForSelect() {
  const personnel = await prisma.personnel.findMany({
    where: { IsActive: true },
    select: { Personnel_ID: true, Full_Name: true, Personnel_Code: true, Role: true, Personal_Image_Path: true }
  });
  return JSON.parse(JSON.stringify(personnel));
}

// ۳. ثبت پروژه جدید و تخصیص به چند کارمند
export async function createProjectAction(formData: FormData): Promise<void> {
  const projectCode = formData.get('projectCode') as string;
  const projectName = formData.get('projectName') as string;
  const description = formData.get('description') as string;
  const startDate = formData.get('startDate') as string;
  const goldenDate = formData.get('goldenDate') as string;
  const endDate = formData.get('endDate') as string;
  const deadlineDate = formData.get('deadlineDate') as string;
  const goldenBonusPercent = parseFloat(formData.get('goldenBonusPercent') as string) || 0;
  const delayPenaltyPercent = parseFloat(formData.get('delayPenaltyPercent') as string) || 0;
  const budget = parseFloat(formData.get('budget') as string);
  
  const personnelIds = formData.getAll('personnelId').map(id => parseInt(id as string));
  const personnelRoles = formData.getAll('personnelRole').map(role => role as string);

  // --- اصلاح شده ---
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  let managerId: number | null = null;

  if (session) {
    const user = await verifySession(session);
    if (user) {
      managerId = user.userId;
    }
  }
  // -----------------

  const projectLeaderId = formData.get('projectLeaderId') ? parseInt(formData.get('projectLeaderId') as string) : null;

  try {
    const newProject = await prisma.pR_Projects.create({
      data: {
        Project_Code: projectCode,
        Project_Name: projectName,
        Description: description,
        Start_Date: startDate ? new Date(startDate) : null,
        Golden_Date: goldenDate ? new Date(goldenDate) : null,
        End_Date: endDate ? new Date(endDate) : null,
        Deadline_Date: deadlineDate ? new Date(deadlineDate) : null,
        Golden_Bonus_Percent: goldenBonusPercent,
        Delay_Penalty_Percent: delayPenaltyPercent,
        Budget: budget || 0,
        Status: 'Active',
        Manager_ID: managerId ? Number(managerId) : null,
        Project_Leader_ID: projectLeaderId,
      }
    });

    if (personnelIds.length > 0) {
      await prisma.pR_Project_Assignments.createMany({
        data: personnelIds.map((pId, index) => ({
          Project_ID: newProject.Project_ID,
          Personnel_ID: pId,
          Assigned_From: new Date(),
          Role_In_Project: personnelRoles[index] || 'عضو پروژه',
          Is_Active: true
        }))
      });
    }
  } catch (error: any) {
    console.error("خطا در ثبت پروژه:", error.message);
  }

  revalidatePath('/dashboard/projects');
}

// ۳. حذف کامل پروژه
export async function deleteProjectAction(formData: FormData) {
  const projectId = parseInt(formData.get('projectId') as string);

  try {
    await prisma.pR_Project_Assignments.deleteMany({
      where: { Project_ID: projectId }
    });
    await prisma.pR_Projects.delete({
      where: { Project_ID: projectId }
    });
  } catch (error: any) {
    console.error("خطا در حذف پروژه:", error.message);
    return { error: "خطا در حذف پروژه" };
  }

  revalidatePath('/dashboard/projects');
  return { success: true };
}