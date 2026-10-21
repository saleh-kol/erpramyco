import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// مخزن بیرون از public — ماندگار در dev و build
const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');

// فقط این فرمت‌ها مجازند (svg حذف شد — ریسک XSS)
const ALLOWED_EXT = ["png", "jpg", "jpeg", "webp"];
const MAX_SIZE = 2 * 1024 * 1024; // ۲ مگابایت

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "فایلی ارسال نشده است" }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: "فقط فایل عکس مجاز است" }, { status: 400 });
    }

    // پسوند پاکسازی‌شده + وایت‌لیست
    const rawExt = file.name.split('.').pop() || '';
    const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!ALLOWED_EXT.includes(ext)) {
      return NextResponse.json(
        { error: "فرمت مجاز نیست — فقط PNG، JPG و WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "حجم عکس بیشتر از ۲ مگابایت است" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `profile-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;

    // ذخیره در uploads/profiles (بیرون public)
    const uploadDir = path.join(UPLOADS_ROOT, 'profiles');
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), buffer);

    // URL سرو از API Route — این مقدار در دیتابیس ذخیره می‌شود
    const relativePath = `/api/uploads/profiles/${filename}`;

    return NextResponse.json({ path: relativePath });
  } catch (error: any) {
    return NextResponse.json({ error: `خطا در آپلود: ${error.message}` }, { status: 500 });
  }
}