"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/session";

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "نام کاربری و رمز عبور الزامی است." };
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
      return { error: "رمز عبور اشتباه است." };
    }

    // آپدیت زمان آخرین ورود
    await prisma.users.update({
      where: { User_ID: user.User_ID },
      data: { Last_Login: new Date() },
    });

    // ساخت سشن امن (JWT)
    const sessionToken = await createSession({
      userId: user.User_ID,
      role: user.Personnel?.Role || 'User',
      name: user.Personnel?.Full_Name || user.Username,
      image: user.Personnel?.Personal_Image_Path || null
    });
    
    const cookieStore = await cookies()
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: false,
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