"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getWorkTypesAndLocations() {
  const types = await prisma.pR_Work_Types.findMany({ 
    where: { Is_Active: true }, 
    orderBy: { Work_Type_Name: 'asc' } 
  });
  
  const locations = await prisma.pR_Work_Locations.findMany({ 
    where: { Is_Active: true }, 
    orderBy: { Location_Name: 'asc' } 
  });
  
  return JSON.parse(JSON.stringify({ types, locations }));
}


export async function addWorkTypeAction(formData: FormData) {
  const name = formData.get('name') as string;
  const code = formData.get('code') as string || `WT-${Date.now()}`;
  await prisma.pR_Work_Types.create({ data: { Work_Type_Name: name, Work_Type_Code: code, Is_Active: true } });
  revalidatePath('/dashboard/activity-settings');
}

export async function deleteWorkTypeAction(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  // به جای حذف فیزیکی، آن را غیرفعال می‌کنیم (Soft Delete)
  await prisma.pR_Work_Types.update({
    where: { Work_Type_ID: id },
    data: { Is_Active: false }
  });
  revalidatePath('/dashboard/activity-settings');
}

export async function addLocationAction(formData: FormData) {
  const name = formData.get('name') as string;
  const code = formData.get('code') as string || `LOC-${Date.now()}`;
  await prisma.pR_Work_Locations.create({ data: { Location_Name: name, Location_Code: code, Is_Active: true } });
  revalidatePath('/dashboard/activity-settings');
}

export async function deleteLocationAction(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  // به جای حذف فیزیکی، آن را غیرفعال می‌کنیم (Soft Delete)
  await prisma.pR_Work_Locations.update({
    where: { Location_ID: id },
    data: { Is_Active: false }
  });
  revalidatePath('/dashboard/activity-settings');
}