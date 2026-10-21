import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { MISSION_ATTACHMENT } from "./constants";

/** مخزن آپلود: بیرون از public — ماندگار در dev و build */
export function getUploadsDir(): string {
  return path.join(process.cwd(), "uploads");
}

/** اعتبارسنجی فایل — همیشه سمت سرور اجرا می‌شود */
export function validateAttachmentFile(file: File): string | null {
  if (file.size > MISSION_ATTACHMENT.MAX_SIZE_BYTES) {
    return `حجم فایل بیشتر از ${MISSION_ATTACHMENT.MAX_SIZE_LABEL} مجاز نیست`;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!MISSION_ATTACHMENT.ALLOWED_EXTENSIONS.includes(ext)) {
    return `فرمت «.${ext || "نامشخص"}» مجاز نیست — فرمت‌های مجاز: ${MISSION_ATTACHMENT.ALLOWED_LABEL}`;
  }
  return null;
}

/** ذخیره فایل روی دیسک با نام یکتا — خروجی: URL مسیر API */
export async function saveAttachmentFile(
  file: File,
  commuteId: number
): Promise<{ savedPath: string } | { error: string }> {
  try {
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const buffer = Buffer.from(await file.arrayBuffer());
    const dir = path.join(getUploadsDir(), "missions", String(commuteId));
    await fs.mkdir(dir, { recursive: true });
    const fileName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
    await fs.writeFile(path.join(dir, fileName), buffer);
    return { savedPath: `/api/uploads/missions/${commuteId}/${fileName}` };
  } catch {
    return { error: "خطا در ذخیره فایل روی سرور" };
  }
}

/** حذف فایل از دیسک — هر دو قالب قدیمی (/uploads/) و جدید (/api/uploads/) را می‌فهمد */
export async function deleteAttachmentFile(fileUrl: string): Promise<void> {
  try {
    const rel = fileUrl
      .replace(/^\/api\/uploads\//, "")
      .replace(/^\/uploads\//, "");
    const safePath = path.join(getUploadsDir(), rel);
    if (!safePath.startsWith(getUploadsDir())) return; // مسیر مشکوک — نادیده بگیر
    await fs.unlink(safePath);
  } catch {
    // فایل شاید از قبل حذف شده باشد — نادیده بگیر
  }
}