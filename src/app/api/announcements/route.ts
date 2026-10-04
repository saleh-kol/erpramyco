import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) return NextResponse.json({ error: "فایلی ارسال نشده است" }, { status: 400 });

    const allowedTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word
      'image/png', 
      'image/jpeg'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "فرمت فایل مجاز نیست (فقط PDF, Excel, Word, PNG, JPG)" }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      return NextResponse.json({ error: "حجم فایل نباید بیشتر از ۲ مگابایت باشد" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `ann_${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'announcements');
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/announcements/${filename}`, type: file.type });
  } catch (error) {
    return NextResponse.json({ error: "خطا در آپلود فایل" }, { status: 500 });
  }
}