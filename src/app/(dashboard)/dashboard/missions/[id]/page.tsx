import { getMissionDetails } from "@/actions/missions";
import MissionDetailClient from "./MissionDetailClient";

export default async function MissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // این تابع خودش اطلاعات پرسنل، جایگاه و واحد را هم می‌گیرد
  const data = await getMissionDetails(id);

  if (!data) return <div style={{ padding: "24px" }}>ماموریت یافت نشد</div>;

  return <MissionDetailClient data={data} />;
}