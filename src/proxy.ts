import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'erp-ramyco-secret-key-change-in-production-2024'
)

export async function proxy(request: NextRequest) {
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
    // ۳. فقط بررسی اعتبار توکن (بدون اتصال به دیتابیس)
    await jwtVerify(sessionCookie, secretKey)
    return NextResponse.next()
    
  } catch (error) {
    // ۴. اگر توکن خراب بود یا منقضی شده بود
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.delete('session')
    return response
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}