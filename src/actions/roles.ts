"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/session";
import { cookies } from "next/headers";

// ============================================================
//  ابزار مشترک — آیا کاربر فعلی مدیرعامل است؟
// ============================================================
async function isCurrentUserCEO(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return false;
  const user = await verifySession(session);
  if (!user) return false;
  const dbUser = await prisma.users.findUnique({
    where: { User_ID: user.userId },
    include: { Personnel: { select: { Role: true } } },
  });
  return dbUser?.Personnel?.Role === "CEO";
}

// گرفتن لیست جایگاه‌ها و واحدها
export async function getRolesAndUnits() {
  const positions = await prisma.organizationalPosition.findMany({ orderBy: { Name: "asc" } });
  const units = await prisma.unit.findMany({ orderBy: { Name: "asc" } });
  return JSON.parse(JSON.stringify({ positions, units }));
}

// ============================================================
//  ایجاد جایگاه سازمانی جدید
// ============================================================
export async function createPositionAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "نام جایگاه الزامی است" };
  try {
    await prisma.organizationalPosition.create({ data: { Name: name } });
    revalidatePath("/dashboard/roles");
    return { success: true };
  } catch (error: any) {
    // P2002 = قید یکتایی
    if (error?.code === "P2002") return { error: "این جایگاه قبلاً ثبت شده است" };
    return { error: `خطا در ثبت جایگاه: ${error.message}` };
  }
}

// ایجاد واحد جدید
export async function createUnitAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "نام واحد الزامی است" };
  try {
    await prisma.unit.create({ data: { Name: name } });
    revalidatePath("/dashboard/roles");
    return { success: true };
  } catch (error: any) {
    if (error?.code === "P2002") return { error: "این واحد قبلاً ثبت شده است" };
    return { error: `خطا در ثبت واحد: ${error.message}` };
  }
}

// ============================================================
//  ✅ جدید: ویرایش جایگاه سازمانی
// ============================================================
export async function updatePositionAction(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const name = (formData.get("name") as string)?.trim();
  if (isNaN(id)) return { error: "شناسه نامعتبر است" };
  if (!name) return { error: "نام جایگاه الزامی است" };
  try {
    await prisma.organizationalPosition.update({ where: { Position_ID: id }, data: { Name: name } });
    revalidatePath("/dashboard/roles");
    revalidatePath("/dashboard/personnel"); // پرسنل جایگاه را نشان می‌دهد
    return { success: true };
  } catch (error: any) {
    if (error?.code === "P2002") return { error: "جایگاهی با این نام قبلاً ثبت شده است" };
    return { error: `خطا در ویرایش جایگاه: ${error.message}` };
  }
}

// ✅ جدید: ویرایش واحد سازمانی
export async function updateUnitAction(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const name = (formData.get("name") as string)?.trim();
  if (isNaN(id)) return { error: "شناسه نامعتبر است" };
  if (!name) return { error: "نام واحد الزامی است" };
  try {
    await prisma.unit.update({ where: { Unit_ID: id }, data: { Name: name } });
    revalidatePath("/dashboard/roles");
    revalidatePath("/dashboard/personnel");
    return { success: true };
  } catch (error: any) {
    if (error?.code === "P2002") return { error: "واحدی با این نام قبلاً ثبت شده است" };
    return { error: `خطا در ویرایش واحد: ${error.message}` };
  }
}

// گرفتن لیست کاربران برای صفحه مدیریت دسترسی
export async function getUsersForAccessManagement() {
  const users = await prisma.users.findMany({
    include: {
      Personnel: {
        include: { OrganizationalPosition: true, Unit: true },
      },
      UserPageAccess: true,
    },
    orderBy: { User_ID: "desc" },
  });
  return JSON.parse(JSON.stringify(users));
}

// آپدیت دسترسی‌های یک کاربر — 🔴 فیکس گارد نقش
export async function updateUserAccessAction(userId: number, routes: string[]) {
  // ✅ فیکس: currentUser.role وجود ندارد — نقش از Personnel خوانده می‌شود
  const isCEO = await isCurrentUserCEO();
  if (!isCEO) {
    return { error: "شما دسترسی به این عملیات ندارید. فقط مدیرعامل می‌تواند دسترسی‌ها را تغییر دهد." };
  }

  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const currentUser = session ? await verifySession(session) : null;
  if (!currentUser) return { error: "نشست نامعتبر است" };

  try {
    await prisma.userPageAccess.deleteMany({ where: { User_ID: userId } });

    if (routes.length > 0) {
      await prisma.userPageAccess.createMany({
        data: routes.map((route) => ({ User_ID: userId, Route: route })),
      });

      await prisma.accessChangeLog.createMany({
        data: routes.map((route) => ({
          Target_User_ID: userId,
          Actor_User_ID: currentUser.userId,
          Action_Type: "GRANT",
          Route: route,
        })),
      });
    }

    revalidatePath("/dashboard/access-management");
    return { success: true };
  } catch (error: any) {
    return { error: `خطا در بروزرسانی دسترسی: ${error.message}` };
  }
}

// حذف جایگاه سازمانی
export async function deletePositionAction(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  if (isNaN(id)) return { error: "شناسه نامعتبر است" };
  try {
    await prisma.organizationalPosition.delete({ where: { Position_ID: id } });
    revalidatePath("/dashboard/roles");
    revalidatePath("/dashboard/personnel");
    return { success: true };
  } catch (error: any) {
    return { error: "امکان حذف این جایگاه وجود ندارد. (احتمالاً به پرسنل اختصاص داده شده است)" };
  }
}

// حذف واحد سازمانی
export async function deleteUnitAction(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  if (isNaN(id)) return { error: "شناسه نامعتبر است" };
  try {
    await prisma.unit.delete({ where: { Unit_ID: id } });
    revalidatePath("/dashboard/roles");
    revalidatePath("/dashboard/personnel");
    return { success: true };
  } catch (error: any) {
    return { error: "امکان حذف این واحد وجود ندارد. (احتمالاً به پرسنل اختصاص داده شده است)" };
  }
}