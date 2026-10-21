import { getMyProjects } from "@/actions/myProjects";
import MyProjectsClient from "./MyProjectsClient";

export const dynamic = "force-dynamic";

export default async function MyProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusParam } = await searchParams;
  const validStatuses = ["Active", "OnHold", "Completed"];
  const status = statusParam && validStatuses.includes(statusParam) ? statusParam : "Active";
  const projects = await getMyProjects(status);
  return <MyProjectsClient projects={projects} currentStatus={status} />;
}