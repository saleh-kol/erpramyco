import { getMyPeriodDetails } from "@/actions/workHours";
import ActivitiesClient from "./ActivitiesClient";
import { PERIOD_KEYS } from "@/lib/periods";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: periodParam } = await searchParams; 
  const period = periodParam && (PERIOD_KEYS as readonly string[]).includes(periodParam) ? periodParam : "week1";

  const data = await getMyPeriodDetails(period);
  return <ActivitiesClient data={data} period={period} />;
}