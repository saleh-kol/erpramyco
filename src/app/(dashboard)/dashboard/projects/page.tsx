import { getProjects, getPersonnelForSelect } from "@/actions/projects";
import ProjectsClient from "./ProjectsClient";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusParam } = await searchParams;
  
  // بررسی وضعیت و تضمین اینکه حتما یک رشته است
  const validStatuses = ['Active', 'Completed', 'OnHold', 'Cancelled'];
  const status: string = (statusParam && validStatuses.includes(statusParam)) ? statusParam : 'Active';
  
  const projects = await getProjects(status as 'Active' | 'Completed' | 'OnHold' | 'Cancelled');
  const personnel = await getPersonnelForSelect();

  return <ProjectsClient projects={projects} personnel={personnel} currentStatus={status} />;
}