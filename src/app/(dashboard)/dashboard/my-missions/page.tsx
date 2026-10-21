// my-missions/page.tsx
import { getMyMissions } from "@/actions/myMissions";
import MyMissionsClient from "./MyMissionsClient";
import { MY_MISSION_VALID_STATUSES } from "@/lib/mission/constants";

export default async function MyMissionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusParam } = await searchParams;
  const status = statusParam && MY_MISSION_VALID_STATUSES.includes(statusParam) ? statusParam : "pending";
  const missions = await getMyMissions(status);
  return <MyMissionsClient missions={missions} currentStatus={status} />;
}