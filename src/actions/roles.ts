"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/session";
import { cookies } from "next/headers";

// گرفتن لیست جایگاه‌ها و واحدها
export async function getRolesAndUnits() {
  const positions = await prisma.organizationalPosition.findMany();
  const units = await prisma.unit.findMany();
  return JSON.parse(JSON.stringify({ positions, units }));
}

// ایجاد جایگاه سازمانی جدید
export async function createPositionAction(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name) return { error: "نام جایگاه الزامی است" };
  try {
    await prisma.organizationalPosition.create({ data: { Name: name } });
    revalidatePath("/dashboard/roles");
    return { success: true };
  } catch (error: any) {
    return { error: "این جایگاه قبلاً ثبت شده است" };
  }
}

// ایجاد واحد جدید
export async function createUnitAction(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name) return { error: "نام واحد الزامی است" };
  try {
    await prisma.unit.create({ data: { Name: name } });
    revalidatePath("/dashboard/roles");
    return { success: true };
  } catch (error: any) {
    return { error: "این واحد قبلاً ثبت شده است" };
  }
}

// گرفتن لیست کاربران برای صفحه مدیریت دسترسی
export async function getUsersForAccessManagement() {
  const users = await prisma.users.findMany({
    include: {
      Personnel: {
        include: {
          OrganizationalPosition: true,
          Unit: true // <--- این خط را اضافه کنید
        }
      },
      UserPageAccess: true
    },
    orderBy: { User_ID: 'desc' }
  });
  return JSON.parse(JSON.stringify(users));
}

// آپدیت دسترسی‌های یک کاربر
export async function updateUserAccessAction(userId: number, routes: string[]) {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const currentUser = session ? await verifySession(session) : null;

  // فقط مدیر عامل می‌تواند دسترسی‌ها را تغییر دهد
  if (!currentUser || currentUser.role !== 'CEO') {
    return { error: "شما دسترسی به این عملیات ندارید" };
  }

  try {
    // ابتدا تمام دسترسی‌های قبلی کاربر را پاک می‌کنیم
    await prisma.userPageAccess.deleteMany({
      where: { User_ID: userId }
    });

    // سپس دسترسی‌های جدید را ثبت می‌کنیم
    if (routes.length > 0) {
      await prisma.userPageAccess.createMany({
        data: routes.map(route => ({ User_ID: userId, Route: route }))
      });
    }
    
    revalidatePath("/dashboard/access-management");
    return { success: true };
  } catch (error: any) {
    return { error: `خطا در بروزرسانی دسترسی: ${error.message}` };
  }
}