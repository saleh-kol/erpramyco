import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from '@/components/dashboard/Header'
import { verifySession } from '@/lib/session'

// این خط به Next.js می‌گوید: در زمان بیلد (npm run build) این صفحه و تمام صفحات زیرمجموعه آن را استاتیک نسل و دیتابیس را کوئری نزن.
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  if (!sessionCookie) redirect('/')

  const user = await verifySession(sessionCookie.value)
  if (!user) redirect('/')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <Sidebar userRole={user.role} />
      <div className="dashboard-content">
        <Header userName={user.name} userImage={user.image} />
        <main style={{ padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}