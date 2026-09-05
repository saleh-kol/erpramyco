"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ۱. گرفتن اطلاعات پروفایل کاربر فعلی
export async function getMyProfile() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;

  const user = await verifySession(session);
  if (!user) return null;

  const dbUser = await prisma.users.findUnique({
    where: { User_ID: user.userId },
    include: { Personnel: true }
  });

  if (!dbUser || !dbUser.Personnel) return null;
  return JSON.parse(JSON.stringify(dbUser.Personnel));
}

// ۲. آپدیت اطلاعات پروفایل توسط کاربر
export async function updateMyProfileAction(formData: FormData) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return { error: "نشست نامعتبر است" };

  const user = await verifySession(session);
  if (!user) return { error: "نشست نامعتبر است" };

  const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
  if (!dbUser || !dbUser.Personnel_ID) return { error: "پروفایل پرسنلی یافت نشد" };

  const personnelId = dbUser.Personnel_ID;

  const full_name = formData.get('Full_Name') as string;
  const national_code = formData.get('National_Code') as string;
  const department = formData.get('Department') as string;
  const bank_name = formData.get('Bank_Name') as string;
  const bank_account = formData.get('Bank_Account') as string;
  const marital_status = formData.get('Marital_Status') as string;
  const children_count = parseInt(formData.get('Children_Count') as string) || 0;

  let imagePath = undefined;

  // مدیریت آپلود عکس پروفایل
  const file = formData.get('profileImage') as File;
  if (file && file.size > 0) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${personnelId}_${Date.now()}.jpg`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      
      // ساخت پوشه اگر وجود نداشت
      await mkdir(uploadDir, { recursive: true });
      
      await writeFile(path.join(uploadDir, filename), buffer);
      imagePath = `/uploads/${filename}`;
    } catch (error: any) {
      console.error("خطا در آپلود عکس:", error);
      return { error: `خطا در آپلود عکس: ${error.message}` };
    }
  }

  try {
    await prisma.personnel.update({
      where: { Personnel_ID: personnelId },
      data: {
        Full_Name: full_name,
        National_Code: national_code,
        Department: department,
        Bank_Name: bank_name,
        Bank_Account: bank_account,
        Marital_Status: marital_status as any,
        Children_Count: children_count,
        Personal_Image_Path: imagePath,
      }
    });
    
    revalidatePath('/dashboard/profile');
    return { success: true };
  } catch (error: any) {
    return { error: `خطا در بروزرسانی: ${error.message}` };
  }
}