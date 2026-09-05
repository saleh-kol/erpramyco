import { getMonthlySummary } from '@/actions/workHours'
import MonthlyReportClient from './MonthlyReportClient'

export default async function MonthlyReportPage() {
  const data = await getMonthlySummary();
  if (!data) return <div style={{ padding: "24px" }}>داده‌ای یافت نشد</div>;
  return <MonthlyReportClient data={data} />
}