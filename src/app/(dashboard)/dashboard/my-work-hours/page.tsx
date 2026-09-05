import { getMyMonthlyWorkHours } from '@/actions/workHours'
import MyWorkHoursClient from './MyWorkHoursClient'

export default async function MyWorkHoursPage() {
  const data = await getMyMonthlyWorkHours();
  if (!data) return <div style={{ padding: "24px" }}>داده‌ای یافت نشد</div>;
  return <MyWorkHoursClient data={data} />
}