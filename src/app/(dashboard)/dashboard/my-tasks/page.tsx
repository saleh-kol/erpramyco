import { getMyTasks } from '@/actions/tasks'
import MyTasksClient from './MyTasksClient'

export const dynamic = 'force-dynamic';

export default async function MyTasksPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const currentStatus = status || 'Pending';
  
  const tasks = await getMyTasks(currentStatus);
  return <MyTasksClient tasks={tasks} currentStatus={currentStatus} />
}