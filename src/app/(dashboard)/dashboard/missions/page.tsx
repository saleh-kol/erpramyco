import { getMissions, getPersonnelForMission } from "@/actions/missions";
import MissionsClient from "./MissionsClient";

export default async function MissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;

const validStatuses = [
  "pending",
  "inprogress",
  "completed",
  "approved",
  "rejected",
];

  const status =
    statusParam && validStatuses.includes(statusParam)
      ? statusParam
      : "pending";

  const missions = await getMissions(status);
  const personnel = await getPersonnelForMission();

  return (
    <MissionsClient
      missions={missions}
      personnel={personnel}
      currentStatus={status}
    />
  );
}