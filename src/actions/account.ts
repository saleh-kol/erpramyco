"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import bcrypt from "bcryptjs";

// ============================================================
//  ۱) نام کاربری کاربر فعلی (نمایش در پروفایل)
// ============================================================
export async function getMyAccountInfo() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const user = await verifySession(token);
  if (!user) return null;

  const dbUser = await prisma.users.findUnique({
    where: { User_ID: user.userId },
    select: {
      Username: true,
      Created_At: true,
      Last_Login: true,
    },
  });

  if (!dbUser) return null;
  return JSON.parse(JSON.stringify(dbUser));
}

// ============================================================
//  ۲) تغییر رمز عبور
//  جریان: تأیید رمز فعلی → قوانین رمز جدید → هش → ذخیره
// ============================================================
export async function changePasswordAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return { error: "نشست نامعتبر است — دوباره وارد شوید" };

    const user = await verifySession(token);
    if (!user) return { error: "نشست نامعتبر است" };

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // ---------- اعتبارسنجی ورودی‌ها ----------
    if (!currentPassword) return { error: "رمز فعلی الزامی است" };
    if (!newPassword) return { error: "رمز جدید الزامی است" };
    if (newPassword.length < 6) return { error: "رمز جدید باید حداقل ۶ کاراکتر باشد" };
    if (newPassword !== confirmPassword) return { error: "رمز جدید و تکرار آن یکسان نیستند" };
    if (newPassword === currentPassword) return { error: "رمز جدید نباید با رمز فعلی یکسان باشد" };

    // ---------- دریافت کاربر و رمز فعلی ----------
    const dbUser = await prisma.users.findUnique({
      where: { User_ID: user.userId },
      select: { User_ID: true, PasswordHash: true },
    });
    if (!dbUser) return { error: "کاربر یافت نشد" };

    // ---------- 🔒 تأیید رمز فعلی (تأیید هویت) ----------
    const isCurrentValid = await bcrypt.compare(currentPassword, dbUser.PasswordHash);
    if (!isCurrentValid) return { error: "رمز فعلی نادرست است" };

    // ---------- هش و ذخیره ----------
    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: { User_ID: dbUser.User_ID },
      data: { PasswordHash: newHash },
    });

    revalidatePath("/dashboard/profile");
    return { success: true };
  } catch (error: any) {
    console.error("خطا در تغییر رمز:", error.message);
    return { error: `خطا در تغییر رمز: ${error.message}` };
  }
}