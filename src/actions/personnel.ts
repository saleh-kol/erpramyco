"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { Personnel_Role } from "@prisma/client";

// ۱. گرفتن لیست همه پرسنل برای نمایش در کارت‌ها
export async function getPersonnel() {
  const personnel = await prisma.personnel.findMany({
    include: {
      // دیگر جدول Users را اینکلود نمی‌کنیم چون نیازی به آن در کارت‌ها نداریم
      Personnel_Hourly_Rates: {
        where: { Is_Active: true },
        orderBy: { Effective_From: "desc" },
        take: 1, // فقط آخرین نرخ ساعتی فعال
      },
    },
    orderBy: { Full_Name: "asc" },
  });

  // تبدیل داده‌های Prisma به JSON ساده
  return JSON.parse(JSON.stringify(personnel));
}

// ۲. ثبت پرسنل جدید + ساخت یوزر + ثبت نرخ ساعتی
export async function createPersonnelAction(formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const personnelCode = formData.get("personnelCode") as string;
const roleValueMap: Record<string, Personnel_Role> = {
  "Factory Manager": Personnel_Role.Factory_Manager,
  "Production Supervisor": Personnel_Role.Production_Supervisor,
  ModirNet: Personnel_Role.ModirNet,
  Repairer: Personnel_Role.Repairer,
  Operator: Personnel_Role.Operator,
  Commerce: Personnel_Role.Commerce,
  Contractor: Personnel_Role.Contractor,
};;

  const prismaRole = roleValueMap[formData.get("role") as string] || Personnel_Role.Operator; // Default to Operator if not found
  const employmentType = formData.get("employmentType") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  try {
    await prisma.$transaction(async (tx) => {
      // ۱. ساخت پرسنل
      const newPersonnel = await tx.personnel.create({
        data: {
          Full_Name: fullName,
          Personnel_Code: personnelCode,
          Role: prismaRole,
          Employment_Type: employmentType as any,
          IsActive: true,
        },
      });

      // ۲. ساخت یوزر برای لاگین
      const hash = await bcrypt.hash(password, 10);
      await tx.users.create({
        data: {
          Personnel_ID: newPersonnel.Personnel_ID,
          Username: username,
          PasswordHash: hash,
          IsActive: true,
        },
      });

      // بخش نرخ ساعتی کاملا حذف شد
    });
  } catch (error: any) {
    console.error(error);
    
    // تشخیص خطای تکراری بودن (کد پرسنلی یا نام کاربری)
    if (error.code === 'P2002') {
      return { error: "این کد پرسنلی یا نام کاربری قبلاً در سیستم ثبت شده است." };
    }
    
    // سایر خطاها
    return { error: `خطا در ثبت پرسنل: ${error.message}` };
  }

  redirect("/dashboard/personnel");
}
