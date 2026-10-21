import { getMissionDetails, checkMissionPermissions } from "@/actions/missions";
import MissionDetailClient from "./MissionDetailClient";

export const dynamic = "force-dynamic";

export default async function MissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, perms] = await Promise.all([getMissionDetails(id), checkMissionPermissions()]);

  if (!data) return <div style={{ padding: "24px" }}>ماموریت یافت نشد یا دسترسی ندارید</div>;

  return <MissionDetailClient data={data} canReview={perms.canReview} />;
}