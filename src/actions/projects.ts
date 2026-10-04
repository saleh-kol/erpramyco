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
  const personnelWages = formData.getAll('personnelWage').map(wage => parseFloat(wage as string) || 0);
  const projectLeaderId = formData.get('projectLeaderId') ? parseInt(formData.get('projectLeaderId') as string) : null;

  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  let managerId: number | null = null;

  if (session) {
    const user = await verifySession(session);
    if (user) {
      managerId = user.userId;
    }
  }

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
          Personnel_Wage: personnelWages[index] || 0,
          Is_Active: true
        }))
      });
    }

    // ثبت فازهای پروژه
    const phaseCount = parseInt(formData.get('phaseCount') as string) || 0;
    if (phaseCount > 0) {
      for (let i = 0; i < phaseCount; i++) {
        const pTitle = formData.get(`phaseTitle_${i}`) as string;
        const pStart = formData.get(`phaseStart_${i}`) as string;
        const pEnd = formData.get(`phaseEnd_${i}`) as string;
        const pLeaderId = parseInt(formData.get(`phaseLeaderId_${i}`) as string);
        const memberCount = parseInt(formData.get(`phaseMemberCount_${i}`) as string) || 0;
        
        if (pTitle && pStart && pEnd && pLeaderId && memberCount > 0) {
          // ۱. ساخت فاز
          const newPhase = await prisma.pR_Project_Phases.create({
            data: {
              Project_ID: newProject.Project_ID,
              Title: pTitle,
              Start_Date: new Date(pStart),
              End_Date: new Date(pEnd),
              Status: 'Pending'
            }
          });

          // ۲. تخصیص اعضا به فاز
          const phaseAssignmentsData = [];
          for (let m = 0; m < memberCount; m++) {
            const mId = parseInt(formData.get(`phaseMember_${i}_${m}`) as string);
            if (mId) {
              phaseAssignmentsData.push({
                Phase_ID: newPhase.Phase_ID,
                Personnel_ID: mId,
                Is_Leader: mId === pLeaderId // اگر آیدی عضو با آیدی مسئول برابر بود، او را مدیر فاز می‌کنیم
              });
            }
          }
          
          if (phaseAssignmentsData.length > 0) {
            await prisma.pR_Phase_Assignments.createMany({ data: phaseAssignmentsData });
          }
        }
      }
    }

  } catch (error: any) {
    console.error("خطا در ثبت پروژه:", error.message);
  }

  revalidatePath('/dashboard/projects');
}

// ۴. حذف کامل پروژه
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