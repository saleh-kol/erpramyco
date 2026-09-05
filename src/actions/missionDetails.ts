"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// ۱. گرفتن اطلاعات کامل ماموریت
export async function getMissionDetails(id: string) {
  const mission = await prisma.pR_Commute_Logs.findUnique({
    where: { Commute_ID: parseInt(id) }
  });
  return JSON.parse(JSON.stringify(mission));
}

// ۲. آپدیت اطلاعات ماموریت و امتیاز مدیر
export async function updateMissionAction(formData: FormData): Promise<void> {
  const commuteId = parseInt(formData.get('commuteId') as string);
  const origin = formData.get('origin') as string;
  const destination = formData.get('destination') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const description = formData.get('description') as string;
  const managerScore = formData.get('managerScore') as string;
  const managerComment = formData.get('managerComment') as string;
  const isApproved = formData.get('isApproved') === 'true';

  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  const managerId = session ? JSON.parse(session).userId : null;

  try {
    await prisma.pR_Commute_Logs.update({
      where: { Commute_ID: commuteId },
      data: {
        Origin: origin,
        Destination: destination,
        Amount: amount || 0,
        Description: description,
        Is_Approved: isApproved,
        Manager_Score: managerScore ? parseFloat(managerScore) : null,
        Manager_Comment: managerComment || null,
        Manager_ID: managerId ? Number(managerId) : null,
        Approved_By: managerId ? Number(managerId) : null,
        Approved_At: new Date()
      }
    });
  } catch (error: any) {
    console.error("خطا در ویرایش ماموریت:", error.message);
  }

  revalidatePath(`/dashboard/missions/${commuteId}`);
}

// ۳. حذف ماموریت
export async function deleteMissionAction(formData: FormData) {
  const commuteId = parseInt(formData.get('commuteId') as string);

  try {
    await prisma.pR_Commute_Logs.delete({
      where: { Commute_ID: commuteId }
    });
  } catch (error: any) {
    console.error("خطا در حذف ماموریت:", error.message);
    return { error: `خطا در حذف ماموریت: ${error.message}` };
  }

  revalidatePath('/dashboard/missions');
  return { success: true };
}