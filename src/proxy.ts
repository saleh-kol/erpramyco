// فایل: proxy.ts (جایگزین middleware.ts)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'erp-ramyco-secret-key-change-in-production-2024'
)

export async function proxy(request: NextRequest) {
  // همان کدهای قبلی middleware
  const { pathname } = request.nextUrl

  if (pathname === '/' || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get('session')?.value

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    await jwtVerify(sessionCookie, secretKey)
    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.delete('session')
    return response
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}