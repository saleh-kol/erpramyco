
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

export async function createAnnouncementAction(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const fileUrl = formData.get("fileUrl") as string | null;
  const fileType = formData.get("fileType") as string | null;

  try {
    await prisma.announcement.create({
      data: { title, content, fileUrl, fileType }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: "خطا در ثبت اطلاعیه" };
  }
}

export async function getLatestAnnouncementForUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  const user = await verifySession(session);
  if (!user) return null;

  const latest = await prisma.announcement.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      reads: {
        where: { userId: user.userId }
      }
    }
  });

  if (!latest) return null;

  return {
    ...latest,
    isRead: latest.reads.length > 0
  };
}

export async function markAnnouncementAsRead(announcementId: number) {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return;
  const user = await verifySession(session);
  if (!user) return;

  await prisma.announcementRead.upsert({
    where: {
      userId_announcementId: {
        userId: user.userId,
        announcementId
      }
    },
    update: {},
    create: {
      userId: user.userId,
      announcementId
    }
  });
  revalidatePath("/dashboard");
}

// ۶. گرفتن تمام اطلاعیه‌ها برای صفحه مدیر
export async function getAllAnnouncements() {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return JSON.parse(JSON.stringify(announcements));
}

// ۷. گرفتن یک اطلاعیه مشخص برای ویرایش
export async function getAnnouncementForEdit(id: string) {
  const announcement = await prisma.announcement.findUnique({
    where: { id: parseInt(id) }
  });
  return JSON.parse(JSON.stringify(announcement));
}

// ۸. آپدیت اطلاعیه موجود
export async function updateAnnouncementAction(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const fileUrl = formData.get("fileUrl") as string | null;
  const fileType = formData.get("fileType") as string | null;

  try {
    await prisma.announcement.update({
      where: { id },
      data: { 
        title, 
        content,
        fileUrl: fileUrl || null,
        fileType: fileType || null
      }
    });
    revalidatePath("/dashboard/announcements");
    return { success: true };
  } catch (error) {
    return { error: "خطا در ویرایش اطلاعیه" };
  }
}

// ۹. حذف اطلاعیه
export async function deleteAnnouncementAction(formData: FormData) {
  const id = parseInt(formData.get("id") as string);

  try {
    // ابتدا رکوردهای مرتبط در جدول_reads را حذف می‌کنیم تا خطای ForeignKey رخ ندهد
    await prisma.announcementRead.deleteMany({
      where: { announcementId: id }
    });
    
    await prisma.announcement.delete({
      where: { id }
    });
    
    revalidatePath("/dashboard/announcements");
    return { success: true };
  } catch (error) {
    return { error: "خطا در حذف اطلاعیه" };
  }
}