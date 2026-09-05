import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    // رمز جدیدی که می‌خواهیم برای ادمین تنظیم کنیم
    const newPassword = 'admin123'
    
    // تولید هش با استفاده از کتابخانه خودمان
    const newHash = await bcrypt.hash(newPassword, 10)
    
    // آپدیت در دیتابیس (دقت کنید مدل شما user یا users؟)
    await prisma.users.update({
      where: { Username: 'admin' },
      data: { PasswordHash: newHash }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: `رمز عبور ادمین با موفقیت به 'admin123' تغییر کرد. حالا می‌توانید لاگین کنید.` 
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}