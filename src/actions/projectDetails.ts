"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ۱. گرفتن اطلاعات کامل پروژه (اصلاح شد: اضافه شدن Leader و Phases)
export async function getProjectDetails(id: string) {
  const project = await prisma.pR_Projects.findUnique({
    where: { Project_ID: parseInt(id) },
    include: {
      Project_Leader: true, // اضافه شد
      PR_Project_Assignments: {
        include: {
          Personnel: true
        }
      },
      PR_Project_Phases: { // اضافه شد
        include: {
          PR_Phase_Assignments: {
            include: { Personnel: true }
          }
        },
        orderBy: { Start_Date: 'asc' }
      }
    }
  });
  return JSON.parse(JSON.stringify(project));
}

// ۲. اکشن ویرایش اطلاعات پروژه و ارزیابی مدیر
export async function updateProjectAction(formData: FormData) {
  const projectId = parseInt(formData.get("projectId") as string);
  
  const managerScore = formData.get("managerScore") as string;
  const status = formData.get("status") as string;
  const managerComment = formData.get("managerComment") as string;

  try {
    await prisma.pR_Projects.update({
      where: { Project_ID: projectId },
      data: {
        Manager_Score: managerScore ? parseFloat(managerScore) : null,
        Status: status,
        Manager_Comment: managerComment || null,
      }
    });
  } catch (error: any) {
    console.error("خطا در بروزرسانی پروژه:", error.message);
    return { error: `خطا در بروزرسانی: ${error.message}` };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/projects");
  
  return { success: true };
}

// ۳. حذف کامل پروژه (اصلاح شد: اضافه شدن حذف فازها)
export async function deleteProjectAction(formData: FormData) {
  const projectId = parseInt(formData.get('projectId') as string);

  try {
    // ۱. ابتدا تخصیص‌های این پروژه به کارمندان حذف می‌شوند
    await prisma.pR_Project_Assignments.deleteMany({
      where: { Project_ID: projectId }
    });

    // ۲. قطع ارتباط گزارش‌های روزانه با این پروژه (تا تاریخچه کارکرد پاک نشود)
    await prisma.pR_Daily_Reports.updateMany({
      where: { Project_ID: projectId },
      data: { Project_ID: null }
    });

    // ۳. حذف تخصیص اعضای فازها
    const phases = await prisma.pR_Project_Phases.findMany({
      where: { Project_ID: projectId },
      select: { Phase_ID: true }
    });
    const phaseIds = phases.map(p => p.Phase_ID);

    if (phaseIds.length > 0) {
      await prisma.pR_Phase_Assignments.deleteMany({
        where: { Phase_ID: { in: phaseIds } }
      });
    }

    // ۴. حذف خود فازها
    await prisma.pR_Project_Phases.deleteMany({
      where: { Project_ID: projectId }
    });

    // ۵. سپس خود پروژه حذف می‌شود
    await prisma.pR_Projects.delete({
      where: { Project_ID: projectId }
    });
  } catch (error: any) {
    console.error("خطا در حذف پروژه:", error.message);
    return { error: `خطا در حذف پروژه: ${error.message}` };
  }

  revalidatePath('/dashboard/projects');
  return { success: true };
}