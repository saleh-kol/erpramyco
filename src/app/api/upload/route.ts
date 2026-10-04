import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "فایلی ارسال نشده است" }, { status: 400 });
    }

    // بررسی نوع فایل (فقط عکس)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: "فقط فایل عکس مجاز است" }, { status: 400 });
    }

    // ساخت نام یونیک برای فایل
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop();
    const filename = `profile-${Date.now()}.${ext}`;

    // ذخیره فایل در پوشه public/uploads
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);
    
    await fs.writeFile(filepath, buffer);

    // بازگرداندن مسیر نسبی (این چیزی است که در دیتابیس ذخیره می‌شود)
    const relativePath = `/uploads/${filename}`;
    
    return NextResponse.json({ path: relativePath });
  } catch (error: any) {
    return NextResponse.json({ error: `خطا در آپلود: ${error.message}` }, { status: 500 });
  }
}