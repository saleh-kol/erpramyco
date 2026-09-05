import { getProjectDetails } from "@/actions/projectDetails";
import ProjectDetailClient from "./ProjectDetailClient";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProjectDetails(id);

  if (!data) return <div style={{ padding: "24px" }}>پروژه یافت نشد</div>;

  return <ProjectDetailClient data={data} />;
}