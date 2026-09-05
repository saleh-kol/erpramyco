import { getMyProjects } from '@/actions/myProjects'
import MyProjectsClient from './MyProjectsClient'

export default async function MyProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusParam } = await searchParams;
  const status = statusParam === 'Completed' ? 'Completed' : 'Active';
  const projects = await getMyProjects(status);
  return <MyProjectsClient projects={projects} currentStatus={status} />
}