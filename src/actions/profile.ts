"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { promises as fs } from "fs";
import path from "path";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

// ============================================================
//  ۱. گرفتن اطلاعات پروفایل کاربر فعلی
// ============================================================
export async function getMyProfile() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;

  const user = await verifySession(session);
  if (!user) return null;

  const dbUser = await prisma.users.findUnique({
    where: { User_ID: user.userId },
    include: { Personnel: true },
  });

  if (!dbUser || !dbUser.Personnel) return null;
  return JSON.parse(JSON.stringify(dbUser.Personnel));
}

// ============================================================
//  ۲. آپدیت پروفایل — بدون مدیریت فایل (فقط مسیر امن از API آپلود)
//  🔴 فیکس: وقتی عکس جدید انتخاب نشده، عکس قبلی پاک نمی‌شود
// ============================================================
export async function updateMyProfileAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return { error: "نشست نامعتبر است" };

    const user = await verifySession(session);
    if (!user) return { error: "نشست نامعتبر است" };

    const dbUser = await prisma.users.findUnique({ where: { User_ID: user.userId } });
    if (!dbUser || !dbUser.Personnel_ID) return { error: "پروفایل پرسنلی یافت نشد" };

    const personnelId = dbUser.Personnel_ID;

    // ---------- اعتبارسنجی ورودی‌ها ----------
    const full_name = (formData.get("Full_Name") as string)?.trim();
    if (!full_name) return { error: "نام و نام خانوادگی الزامی است" };

    const national_code = (formData.get("National_Code") as string)?.trim() || null;
    if (national_code && !/^\d{10}$/.test(national_code)) {
      return { error: "کد ملی باید ۱۰ رقم عددی باشد" };
    }

    const department = (formData.get("Department") as string)?.trim() || null;
    const bank_name = (formData.get("Bank_Name") as string)?.trim() || null;
    const bank_account = (formData.get("Bank_Account") as string)?.trim() || null;

    const marital_status_raw = formData.get("Marital_Status") as string;
    const marital_status =
      marital_status_raw === "Single" || marital_status_raw === "Married" ? marital_status_raw : undefined;

    const childrenCountRaw = formData.get("Children_Count") as string;
    const children_count =
      childrenCountRaw !== null && childrenCountRaw.trim() !== ""
        ? Math.max(0, parseInt(childrenCountRaw) || 0)
        : undefined;

    // ---------- مسیر عکس (از API آپلود می‌آید — نه فایل) ----------
    const imagePathRaw = (formData.get("imagePath") as string)?.trim();
    if (imagePathRaw && !imagePathRaw.startsWith("/api/uploads/profiles/")) {
      // گارد امنیتی: فقط مسیر معتبر از API خودمان پذیرفته می‌شود
      return { error: "مسیر عکس نامعتبر است" };
    }

    // 🔴 فیکس: عکس قدیمی فقط در صورت وجود عکس جدید تعویض می‌شود
    let imagePath: string | undefined = undefined;
    if (imagePathRaw) imagePath = imagePathRaw;

    // عکس قدیمی — برای پاکسازی در صورت تعویض
    let oldImagePath: string | null = null;
    if (imagePath) {
      const old = await prisma.personnel.findUnique({
        where: { Personnel_ID: personnelId },
        select: { Personal_Image_Path: true },
      });
      oldImagePath = old?.Personal_Image_Path ?? null;
    }

    // ---------- آپدیت دیتابیس ----------
    await prisma.personnel.update({
      where: { Personnel_ID: personnelId },
      data: {
        Full_Name: full_name,
        National_Code: national_code,
        Department: department,
        Bank_Name: bank_name,
        Bank_Account: bank_account,
        ...(marital_status !== undefined ? { Marital_Status: marital_status as any } : {}),
        ...(children_count !== undefined ? { Children_Count: children_count } : {}),
        // فقط وقتی عکس جدید آمد ذخیره می‌شود — وگرنه دست‌نخورده
        ...(imagePath !== undefined ? { Personal_Image_Path: imagePath } : {}),
      },
    });

    // ---------- پاکسازی عکس قدیمی از دیسک (اختیاری، غیرمسدودکننده) ----------
    if (imagePath && oldImagePath?.startsWith("/api/uploads/profiles/")) {
      try {
        const rel = oldImagePath.replace(/^\/api\/uploads\//, "");
        const safePath = path.join(UPLOADS_ROOT, rel);
        if (safePath.startsWith(UPLOADS_ROOT)) {
          await fs.unlink(safePath).catch(() => {});
        }
      } catch {
        // پاکسازی شکست بخورد مانع ذخیره نمی‌شود
      }
    }

    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("خطا در ذخیره پروفایل:", error.message);
    return { error: `خطا در بروزرسانی: ${error.message}` };
  }
}