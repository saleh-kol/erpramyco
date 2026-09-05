"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ۱. گرفتن اطلاعات کامل پروژه
export async function getProjectDetails(id: string) {
  const project = await prisma.pR_Projects.findUnique({
    where: { Project_ID: parseInt(id) },
    include: {
      PR_Project_Assignments: {
        include: {
          Personnel: true
        }
      }
    }
  });
  return JSON.parse(JSON.stringify(project));
}

// ۲. آپدیت اطلاعات پروژه و امتیاز مدیرعامل
export async function updateProjectAction(formData: FormData): Promise<void> {
  const projectId = parseInt(formData.get('projectId') as string);
  const projectCode = formData.get('projectCode') as string;
  const projectName = formData.get('projectName') as string;
  const description = formData.get('description') as string;
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;
  const budget = parseFloat(formData.get('budget') as string);
  const status = formData.get('status') as 'Active' | 'Completed' | 'Cancelled' | 'OnHold';
  const managerScore = formData.get('managerScore') as string;
  const managerComment = formData.get('managerComment') as string;

  try {
    await prisma.pR_Projects.update({
      where: { Project_ID: projectId },
      data: {
        Project_Code: projectCode,
        Project_Name: projectName,
        Description: description,
        Start_Date: startDate ? new Date(startDate) : null,
        End_Date: endDate ? new Date(endDate) : null,
        Budget: budget || 0,
        Status: status,
        Manager_Score: managerScore ? parseFloat(managerScore) : null,
        Manager_Comment: managerComment || null,
      }
    });
  } catch (error: any) {
    console.error("خطا در ویرایش پروژه:", error.message);
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
}

// ۳. حذف کامل پروژه
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

    // ۳. سپس خود پروژه حذف می‌شود
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