import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { getEmployeeDashboardData, getManagerDashboardData, getFinanceDashboardData } from '@/actions/dashboardData'
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard'
import ManagerDashboard from '@/components/dashboard/ManagerDashboard'

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  
  if (!sessionCookie) return null
  
  const user = await verifySession(sessionCookie.value)
  if (!user) return null

  // داشبورد مدیرعامل (CEO)
  if (user.role === 'CEO') {
    const data = await getManagerDashboardData();
    if (!data) return null;
    return <ManagerDashboard data={data} user={user} />
  }

  // داشبورد سایر کارمندان (User)
  const data = await getEmployeeDashboardData();
  if (!data) return null;

  return <EmployeeDashboard data={data} user={user} />
}