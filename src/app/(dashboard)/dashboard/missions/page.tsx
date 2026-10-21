import { getMissions, getPersonnelForMission, checkMissionPermissions } from "@/actions/missions";
import MissionsClient from "./MissionsClient";
import { MANAGER_MISSION_VALID_STATUSES } from "@/lib/mission/constants";

export const dynamic = "force-dynamic";

export default async function MissionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusParam } = await searchParams;
  const status = statusParam && MANAGER_MISSION_VALID_STATUSES.includes(statusParam) ? statusParam : "pending";

  const { canReview, subordinateCount, isCEO } = await checkMissionPermissions();

  const missions = await getMissions(status);
  const personnel = await getPersonnelForMission(); // فقط زیرمجموعه‌ها

  return (
    <MissionsClient
      missions={missions}
      personnel={personnel}
      currentStatus={status}
      canReview={canReview}
      subordinateCount={subordinateCount}
      isCEO={isCEO}
    />
  );
}