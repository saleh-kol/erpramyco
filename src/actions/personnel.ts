"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers"; // <--- این خط اضافه شود
import { verifySession } from "@/lib/session"; // <--- این خط اضافه شود

// ۱. گرفتن لیست همه پرسنل برای نمایش در کارت‌ها
export async function getPersonnel() {
  const personnel = await prisma.personnel.findMany({
    include: {
      OrganizationalPosition: true, // جایگاه سازمانی
      Unit: true,                    // واحد سازمانی
      Personnel_Hourly_Rates: {
        where: { Is_Active: true },
        orderBy: { Effective_From: "desc" },
        take: 1,
      },
    },
    orderBy: { Full_Name: "asc" },
  });

  return JSON.parse(JSON.stringify(personnel));
}

// ۲. ثبت پرسنل جدید + ساخت یوزر
export async function createPersonnelAction(formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const personnelCode = formData.get("personnelCode") as string;
  const positionId = formData.get("positionId") as string;
  const unitId = formData.get("unitId") as string;
  const employmentType = formData.get("employmentType") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  // --- بررسی اینکه آیا کاربر فعلی مدیرعامل است یا خیر ---
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const currentUser = session ? await verifySession(session) : null;
  const dbUser = currentUser ? await prisma.users.findUnique({ where: { User_ID: currentUser.userId }, include: { Personnel: true } }) : null;
  const isCEO = dbUser?.Personnel?.Role === 'CEO';

  try {
    await prisma.$transaction(async (tx) => {
      const newPersonnel = await tx.personnel.create({
        data: {
          Full_Name: fullName,
          Personnel_Code: personnelCode,
          Role: "User",
          Position_ID: positionId ? parseInt(positionId) : null,
          Unit_ID: unitId ? parseInt(unitId) : null,
          Employment_Type: employmentType as any,
          IsActive: isCEO ? true : false, // اگر مدیرعامل نبود، یوزر فعال نیست تا تایید شود
          IsApproved: isCEO ? true : false, // اگر مدیرعامل نبود، نیاز به تایید دارد
        },
      });

      const hash = await bcrypt.hash(password, 10);
      await tx.users.create({
        data: {
          Personnel_ID: newPersonnel.Personnel_ID,
          Username: username,
          PasswordHash: hash,
          IsActive: isCEO ? true : false,
        },
      });
    });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return { error: "این کد پرسنلی یا نام کاربری قبلاً در سیستم ثبت شده است." };
    }
    return { error: `خطا در ثبت پرسنل: ${error.message}` };
  }

  redirect("/dashboard/personnel");
}

// ۳. اکشن تایید یا رد پرسنل توسط مدیرعامل
export async function approvePersonnelAction(formData: FormData) {
  const personnelId = parseInt(formData.get("personnelId") as string);
  const action = formData.get("action") as string; // "approve" or "reject"

  // --- بررسی دسترسی: فقط مدیرعامل می‌تواند تایید کند ---
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const currentUser = session ? await verifySession(session) : null;

  if (!currentUser) return { error: "نشست نامعتبر است" };

  const dbUser = await prisma.users.findUnique({
    where: { User_ID: currentUser.userId },
    include: { Personnel: true }
  });

  if (dbUser?.Personnel?.Role !== 'CEO') {
    return { error: "شما دسترسی به این عملیات ندارید. فقط مدیرعامل می‌تواند تایید کند." };
  }
  // ----------------------------------------------------

  try {
    if (action === "approve") {
      await prisma.personnel.update({
        where: { Personnel_ID: personnelId },
        data: { IsApproved: true, IsActive: true },
      });
      await prisma.users.updateMany({
        where: { Personnel_ID: personnelId },
        data: { IsActive: true }
      });
    } else {
      await prisma.users.deleteMany({ where: { Personnel_ID: personnelId } });
      await prisma.personnel.delete({ where: { Personnel_ID: personnelId } });
    }
  } catch (error: any) {
    return { error: `خطا: ${error.message}` };
  }

  revalidatePath("/dashboard/personnel");
  redirect("/dashboard/personnel");
}

// ۳. گرفتن اطلاعات یک پرسنل برای ویرایش
export async function getPersonnelForEdit(id: string) {
  // بررسی اینکه آیا id به درستی ارسال شده است یا خیر
  const personnelId = parseInt(id);
  if (isNaN(personnelId)) {
    throw new Error("شناسه پرسنل برای ویرایش نامعتبر است");
  }

  const personnel = await prisma.personnel.findUnique({
    where: { Personnel_ID: personnelId },
    include: {
      OrganizationalPosition: true,
      Unit: true,
    }
  });
  return JSON.parse(JSON.stringify(personnel));
}

// ۴. اکشن ویرایش اطلاعات پرسنل
export async function updatePersonnelAction(formData: FormData) {
  const personnelId = parseInt(formData.get("personnelId") as string);
  const fullName = formData.get("fullName") as string;
  const personnelCode = formData.get("personnelCode") as string;
  const positionId = formData.get("positionId") as string;
  const unitId = formData.get("unitId") as string;
  const employmentType = formData.get("employmentType") as string;
  const isActive = formData.get("isActive") === "true";

  try {
    await prisma.personnel.update({
      where: { Personnel_ID: personnelId },
      data: {
        Full_Name: fullName,
        Personnel_Code: personnelCode,
        Position_ID: positionId ? parseInt(positionId) : null,
        Unit_ID: unitId ? parseInt(unitId) : null,
        Employment_Type: employmentType as any,
        IsActive: isActive,
      },
    });
  } catch (error: any) {
    console.error("خطا در ویرایش پرسنل:", error.message);
    return { error: `خطا در بروزرسانی: ${error.message}` };
  }

  revalidatePath("/dashboard/personnel");
  redirect("/dashboard/personnel");
}