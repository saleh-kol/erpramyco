import { getMyTasks } from '@/actions/tasks'
import MyTasksClient from './MyTasksClient'

export default async function MyTasksPage() {
  const tasks = await getMyTasks();
  return <MyTasksClient tasks={tasks} />
}