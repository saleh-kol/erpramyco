import { getTasks, getPersonnelForTask, checkIsCEO } from "@/actions/tasks";
import { getSubordinateIds } from "@/actions/supervision";
import TasksClient from "./TasksClient";
import { TASK_VALID_STATUSES } from "@/lib/task/constants";

export const dynamic = "force-dynamic";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusParam } = await searchParams;
  // 🔧 فیکس: 'Done' حذف شد — در VALID_STATUSES وجود ندارد و به Pending سانسور می‌شد
  const status = statusParam && TASK_VALID_STATUSES.includes(statusParam) ? statusParam : "Pending";

  const isCEO = await checkIsCEO();
  const me = isCEO ? null : null; // personnelId زیر

  // ⭐ آیا کاربر صلاحیت بررسی دارد؟ (CEO یا دارای زیرمجموعه)
  const currentPersonnelId = await (async () => {
    const { getCurrentPersonnelIdInternal } = await import("@/actions/tasks");
    return getCurrentPersonnelIdInternal();
  })();

  let canReview = isCEO;
  let subordinateCount = 0;
  if (currentPersonnelId) {
    const subs = await getSubordinateIds(currentPersonnelId);
    subordinateCount = subs.length;
    if (subordinateCount > 0) canReview = true;
  }

  const tasks = await getTasks(status);
  const personnel = await getPersonnelForTask(); // ✅ فقط زیرمجموعه‌های مستقیم

  return (
    <TasksClient
      tasks={tasks}
      personnel={personnel}
      currentStatus={status}
      canReview={canReview}
      subordinateCount={subordinateCount}
    />
  );
}