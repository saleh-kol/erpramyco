import { getMyPeriodDetails } from '@/actions/workHours'
import PeriodDetailsClient from './PeriodDetailsClient'

export default async function PeriodDetailsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period } = await searchParams;
  const currentPeriod = period || 'week1'; // ذخیره در یک متغیر
  
  const data = await getMyPeriodDetails(currentPeriod);
  if (!data) return <div style={{ padding: "24px" }}>داده‌ای یافت نشد</div>;
  
  // اضافه شدن period={currentPeriod} به پراپ‌ها
  return <PeriodDetailsClient data={data} period={currentPeriod} />
}