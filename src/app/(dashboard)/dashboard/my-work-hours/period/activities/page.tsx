import { getMyPeriodDetails } from "@/actions/workHours"; // مسیر فایل اکشن خود را چک کنید
import ActivitiesClient from "./ActivitiesClient";

export const dynamic = 'force-dynamic';

export default async function ActivitiesPage({ searchParams }: { searchParams: { period?: string } }) {
  const period = searchParams.period || 'week1';
  const data = await getMyPeriodDetails(period);
  
  return <ActivitiesClient data={data} period={period} />;
}