import { getTasks, getPersonnelForTask } from "@/actions/tasks";
import TasksClient from "./TasksClient";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusParam } = await searchParams;
  const status = statusParam === 'Done' ? 'Done' : 'Pending';
  
  const tasks = await getTasks(status);
  const personnel = await getPersonnelForTask();

  return <TasksClient tasks={tasks} personnel={personnel} currentStatus={status} />;
}