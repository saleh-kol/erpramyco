import { getMissions, getPersonnelForMission } from "@/actions/missions";
import MissionsClient from "./MissionsClient";

export default async function MissionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusParam } = await searchParams;
  
  const validStatuses = ['pending', 'approved', 'rejected'];
  const status: string = (statusParam && validStatuses.includes(statusParam)) ? statusParam : 'pending';
  
  const missions = await getMissions(status as any);
  const personnel = await getPersonnelForMission();

  return <MissionsClient missions={missions} personnel={personnel} currentStatus={status} />;
}