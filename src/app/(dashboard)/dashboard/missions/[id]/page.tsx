import { getMissionDetails } from "@/actions/missionDetails";
import { prisma } from "@/lib/prisma";
import MissionDetailClient from "./MissionDetailClient";

export default async function MissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mission = await getMissionDetails(id);

  if (!mission) return <div style={{ padding: "24px" }}>ماموریت یافت نشد</div>;

  // گرفتن اطلاعات پرسنل جداگانه (برای جلوگیری از خطای Relation در Prisma)
  const personnel = await prisma.personnel.findUnique({
    where: { Personnel_ID: mission.Personnel_ID },
    select: { Full_Name: true, Personnel_Code: true, Role: true, Personal_Image_Path: true }
  });

  const data = { ...mission, Personnel: personnel };

  return <MissionDetailClient data={data} />;
}