import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { getEmployeeDashboardData, getManagerDashboardData, getFinanceDashboardData } from '@/actions/dashboardData'
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard'
import ManagerDashboard from '@/components/dashboard/ManagerDashboard'
import FinanceDashboard from '@/components/dashboard/FinanceDashboard'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  
  if (!sessionCookie) return null
  
  const user = await verifySession(sessionCookie.value)
  if (!user) return null

  // داشبورد مدیر کارخانه
  if (user.role === 'مدیر کارخانه') {
    const data = await getManagerDashboardData();
    if (!data) return null;
    return <ManagerDashboard data={data} user={user} />
  }

  // داشبورد واحد مالی
  if (user.role === 'واحد مالی') {
    const data = await getFinanceDashboardData();
    if (!data) return null;
    return <FinanceDashboard data={data} user={user} />
  }

  // داشبورد سایر کارمندان
  const data = await getEmployeeDashboardData();
  if (!data) return null;

  return <EmployeeDashboard data={data} user={user} />
}