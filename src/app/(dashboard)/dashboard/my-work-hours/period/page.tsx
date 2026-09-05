import { getMyPeriodDetails } from '@/actions/workHours'
import PeriodDetailsClient from './PeriodDetailsClient'

export default async function PeriodDetailsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period } = await searchParams;
  const data = await getMyPeriodDetails(period || 'week1');
  if (!data) return <div style={{ padding: "24px" }}>داده‌ای یافت نشد</div>;
  return <PeriodDetailsClient data={data} />
}