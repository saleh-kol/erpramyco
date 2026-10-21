"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============================================================
//  خواندن
// ============================================================
export async function getWorkTypesAndLocations() {
  const types = await prisma.pR_Work_Types.findMany({
    where: { Is_Active: true },
    orderBy: { Work_Type_Name: "asc" },
  });

  const locations = await prisma.pR_Work_Locations.findMany({
    where: { Is_Active: true },
    orderBy: { Location_Name: "asc" },
  });

  return JSON.parse(JSON.stringify({ types, locations }));
}

// ============================================================
//  انواع فعالیت — ایجاد
//  ✅ اگر آیتم غیرفعالی با همان نام هست → reactivate (نه create)
// ============================================================
export async function addWorkTypeAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  try {
    const name = (formData.get("name") as string)?.trim();
    if (!name) return { error: "نام نوع فعالیت الزامی است" };

    // جستجوی آیتم حذف‌شده (غیرفعال) با همان نام
    const existing = await prisma.pR_Work_Types.findFirst({
      where: { Work_Type_Name: name, Is_Active: false },
    });

    if (existing) {
      await prisma.pR_Work_Types.update({
        where: { Work_Type_ID: existing.Work_Type_ID },
        data: { Is_Active: true },
      });
      revalidatePath("/dashboard/activity-settings");
      return { success: true };
    }

    await prisma.pR_Work_Types.create({
      data: {
        Work_Type_Name: name,
        Work_Type_Code: `WT-${Date.now()}`,
        Is_Active: true,
      },
    });

    revalidatePath("/dashboard/activity-settings");
    return { success: true };
  } catch (error: any) {
    if (error?.code === "P2002") return { error: "این نوع فعالیت قبلاً ثبت شده است" };
    return { error: `خطا در ثبت نوع فعالیت: ${error.message}` };
  }
}

// ✅ جدید: ویرایش نوع فعالیت
export async function updateWorkTypeAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  try {
    const id = parseInt(formData.get("id") as string);
    const name = (formData.get("name") as string)?.trim();

    if (isNaN(id)) return { error: "شناسه نامعتبر است" };
    if (!name) return { error: "نام نوع فعالیت الزامی است" };

    // اگر آیتم دیگری (غیر خودش) با این نام هست → duplicate
    const duplicate = await prisma.pR_Work_Types.findFirst({
      where: { Work_Type_Name: name, Is_Active: true, Work_Type_ID: { not: id } },
    });
    if (duplicate) return { error: "نوع فعالیتی با این نام قبلاً ثبت شده است" };

    await prisma.pR_Work_Types.update({
      where: { Work_Type_ID: id },
      data: { Work_Type_Name: name },
    });

    revalidatePath("/dashboard/activity-settings");
    return { success: true };
  } catch (error: any) {
    return { error: `خطا در ویرایش نوع فعالیت: ${error.message}` };
  }
}

// حذف (Soft Delete)
export async function deleteWorkTypeAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  try {
    const id = parseInt(formData.get("id") as string);
    if (isNaN(id)) return { error: "شناسه نامعتبر است" };

    await prisma.pR_Work_Types.update({
      where: { Work_Type_ID: id },
      data: { Is_Active: false },
    });

    revalidatePath("/dashboard/activity-settings");
    return { success: true };
  } catch (error: any) {
    return { error: `خطا در حذف نوع فعالیت: ${error.message}` };
  }
}

// ============================================================
//  محل‌های فعالیت — ایجاد
// ============================================================
export async function addLocationAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  try {
    const name = (formData.get("name") as string)?.trim();
    if (!name) return { error: "نام محل فعالیت الزامی است" };

    const existing = await prisma.pR_Work_Locations.findFirst({
      where: { Location_Name: name, Is_Active: false },
    });

    if (existing) {
      await prisma.pR_Work_Locations.update({
        where: { Location_ID: existing.Location_ID },
        data: { Is_Active: true },
      });
      revalidatePath("/dashboard/activity-settings");
      return { success: true };
    }

    await prisma.pR_Work_Locations.create({
      data: {
        Location_Name: name,
        Location_Code: `LOC-${Date.now()}`,
        Is_Active: true,
      },
    });

    revalidatePath("/dashboard/activity-settings");
    return { success: true };
  } catch (error: any) {
    if (error?.code === "P2002") return { error: "این محل فعالیت قبلاً ثبت شده است" };
    return { error: `خطا در ثبت محل فعالیت: ${error.message}` };
  }
}

// ✅ جدید: ویرایش محل فعالیت
export async function updateLocationAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  try {
    const id = parseInt(formData.get("id") as string);
    const name = (formData.get("name") as string)?.trim();

    if (isNaN(id)) return { error: "شناسه نامعتبر است" };
    if (!name) return { error: "نام محل فعالیت الزامی است" };

    const duplicate = await prisma.pR_Work_Locations.findFirst({
      where: { Location_Name: name, Is_Active: true, Location_ID: { not: id } },
    });
    if (duplicate) return { error: "محل فعالیتی با این نام قبلاً ثبت شده است" };

    await prisma.pR_Work_Locations.update({
      where: { Location_ID: id },
      data: { Location_Name: name },
    });

    revalidatePath("/dashboard/activity-settings");
    return { success: true };
  } catch (error: any) {
    return { error: `خطا در ویرایش محل فعالیت: ${error.message}` };
  }
}

// حذف (Soft Delete)
export async function deleteLocationAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  try {
    const id = parseInt(formData.get("id") as string);
    if (isNaN(id)) return { error: "شناسه نامعتبر است" };

    await prisma.pR_Work_Locations.update({
      where: { Location_ID: id },
      data: { Is_Active: false },
    });

    revalidatePath("/dashboard/activity-settings");
    return { success: true };
  } catch (error: any) {
    return { error: `خطا در حذف محل فعالیت: ${error.message}` };
  }
}