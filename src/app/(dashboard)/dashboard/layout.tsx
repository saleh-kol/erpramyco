import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from '@/components/dashboard/Header'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  if (!sessionCookie) redirect('/')

  const user = await verifySession(sessionCookie.value)
  if (!user) redirect('/')

  // دریافت اطلاعات پرسنل و دسترسی‌ها از دیتابیس
  const dbUser = await prisma.users.findUnique({
    where: { User_ID: user.userId },
    include: {
      Personnel: {
        include: {
          OrganizationalPosition: true
        }
      },
      UserPageAccess: true
    }
  });

  if (!dbUser || !dbUser.Personnel) redirect('/');

  // اصلاح نمایش نقش مدیرعامل
  let userPosition = 'کاربر';
  if (dbUser.Personnel.Role === 'CEO') {
    userPosition = 'مدیرعامل';
  } else if (dbUser.Personnel.OrganizationalPosition?.Name) {
    userPosition = dbUser.Personnel.OrganizationalPosition.Name;
  }

  const allowedRoutes = dbUser.UserPageAccess.map(access => access.Route);
  const isCEO = dbUser.Personnel.Role === 'CEO';
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <Sidebar 
        userPosition={userPosition} 
        allowedRoutes={allowedRoutes} 
        isCEO={isCEO} 
      />
      <div className="dashboard-content">
        <Header 
          userName={dbUser.Personnel.Full_Name} 
          userImage={dbUser.Personnel.Personal_Image_Path} 
        />
        <main style={{ padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}