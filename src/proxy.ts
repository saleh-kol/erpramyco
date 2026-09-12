import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'erp-ramyco-secret-key-change-in-production-2024'
)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ۱. صفحات عمومی (لاگین، API ها و فایل‌های استاتیک) نیازی به چک ندارند
  if (pathname === '/' || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get('session')?.value

  // ۲. اگر توکن نبود، برگرد به صفحه لاگین
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    // ۳. بررسی اعتبار توکن
    const { payload } = await jwtVerify(sessionCookie, secretKey)
    const userId = payload.userId as number

    // ۴. گرفتن اطلاعات کاربر و دسترسی‌های او از دیتابیس
    const dbUser = await prisma.users.findUnique({
      where: { User_ID: userId },
      include: { 
        Personnel: true, 
        UserPageAccess: true 
      }
    })

    if (!dbUser || !dbUser.Personnel) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    const isCEO = dbUser.Personnel.Role === 'CEO'
    const allowedRoutes = dbUser.UserPageAccess.map(a => a.Route)

    // ۵. اگر مدیرعامل بود، به همه جا دسترسی دارد
    if (isCEO) {
      return NextResponse.next()
    }

    // ۶. اگر کاربر عادی بود، چک می‌کنیم آیا مسیر فعلی در دسترسی‌های او هست یا خیر
    // (برای صفحات داینامیک مثل /dashboard/personnel/1 ، بخش اول مسیر را چک می‌کنیم)
    const pathParts = pathname.split('/').slice(0, 3).join('/')
    const isAllowed = allowedRoutes.includes(pathname) || allowedRoutes.includes(pathParts)

    if (isAllowed) {
      return NextResponse.next()
    }

    // ۷. اگر دسترسی نداشت، به داشبورد ریدایرکت کن
    return NextResponse.redirect(new URL('/dashboard', request.url))

  } catch (error) {
    // اگر توکن خراب بود یا منقضی شده بود
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.delete('session')
    return response
  }
}

export const config = {
  // اجرای میان‌افزار در محیط Node.js (برای کار کردن Prisma)
  runtime: 'nodejs',
  // صفحاتی که Middleware روی آن‌ها اعمال می‌شود
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}