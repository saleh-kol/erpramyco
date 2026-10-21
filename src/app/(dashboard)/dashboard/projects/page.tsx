import { getProjects, getPersonnelForSelect, checkProjectPermissions } from "@/actions/projects";
import ProjectsClient from "./ProjectsClient";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusParam } = await searchParams;
  const validStatuses = ["Active", "Completed", "OnHold", "Cancelled"];
  const status: string = statusParam && validStatuses.includes(statusParam) ? statusParam : "Active";

  const { subordinateCount, isCEO } = await checkProjectPermissions();

  const projects = await getProjects(status as "Active" | "Completed" | "OnHold" | "Cancelled");
  const personnel = await getPersonnelForSelect(); // فقط زیرمجموعه‌ها

  return (
    <ProjectsClient
      projects={projects}
      personnel={personnel}
      currentStatus={status}
      subordinateCount={subordinateCount}
      isCEO={isCEO}
    />
  );
}