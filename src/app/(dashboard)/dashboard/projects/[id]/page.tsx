import { prisma } from "@/lib/prisma";
import ProjectDetailClient from "./ProjectDetailClient";

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const project = await prisma.pR_Projects.findUnique({
    where: { Project_ID: parseInt(id) },
    include: {
      Project_Leader: true,
      PR_Project_Assignments: {
        include: { Personnel: true }
      },
      PR_Project_Phases: {
        include: {
          PR_Phase_Assignments: {
            include: { Personnel: true }
          }
        },
        orderBy: { Start_Date: 'asc' }
      }
    }
  });

  if (!project) return <div>پروژه یافت نشد</div>;

  // تبدیل آبجکت Prisma به JSON ساده برای ارسال به Client Component
  const plainProject = JSON.parse(JSON.stringify(project));

  return <ProjectDetailClient data={plainProject} />;
}