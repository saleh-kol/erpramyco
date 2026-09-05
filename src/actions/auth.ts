"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/session";

// شمارنده تلاش‌های ناموفق (در حافظه - برای production از Redis استفاده کنید)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

function isBlocked(username: string): boolean {
  const record = loginAttempts.get(username);
  if (!record) return false;

  // اگر بیش از ۵ بار در ۱۵ دقیقه امتحان کرده، بلاکش کن
  if (record.count >= 5) {
    const timeDiff = Date.now() - record.lastAttempt;
    if (timeDiff < 15 * 60 * 1000) {
      return true;
    }
    // ریست بعد از ۱۵ دقیقه
    loginAttempts.delete(username);
  }
  return false;
}

function recordFailedAttempt(username: string) {
  const record = loginAttempts.get(username) || { count: 0, lastAttempt: 0 };
  record.count++;
  record.lastAttempt = Date.now();
  loginAttempts.set(username, record);
}

// مپینگ نقش‌ها
const roleMap: Record<string, string> = {
  Production_Supervisor: "سرپرست",
  Factory_Manager: "مدیر کارخانه",
  ModirNet: "مدیر نت",
  Repairer: "تعمیرکار",
  Operator: "اپراتور",
  Commerce: "واحد مالی",
  Contractor: "پیمانکار",
};

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "نام کاربری و رمز عبور الزامی است." };
  }

  // بررسی بلاک بودن
  if (isBlocked(username)) {
    return { error: "حساب شما موقتاً بلاک شده است. لطفاً ۱۵ دقیقه دیگر تلاش کنید." };
  }

  try {
    const user = await prisma.users.findFirst({
      where: { Username: username, IsActive: true },
      include: { Personnel: true },
    });

    if (!user) {
      return { error: "کاربری با این مشخصات یافت نشد." };
    }

    const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
    if (!isPasswordValid) {
      recordFailedAttempt(username);
      return { error: "رمز عبور اشتباه است." };
    }

    // اگر لاگین موفق بود، شمارنده را ریست کن
    loginAttempts.delete(username);

    // آپدیت زمان آخرین ورود
    await prisma.users.update({
      where: { User_ID: user.User_ID },
      data: { Last_Login: new Date() },
    });

    // ساخت سشن امن (JWT) - با نقش فارسی
    const sessionToken = await createSession({
      userId: user.User_ID,
      role: roleMap[user.Personnel?.Role || 'Operator'] || 'اپراتور',
      name: user.Personnel?.Full_Name || user.Username,
      image: user.Personnel?.Personal_Image_Path || null
    });
    
    const cookieStore = await cookies()
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: false, // برای localhost
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax'
    });
  } catch (err: any) {
    console.error(err);
    return { error: `خطای فنی: ${err.message}` };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/");
}