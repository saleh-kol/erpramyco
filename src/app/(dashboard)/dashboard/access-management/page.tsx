import { getUsersForAccessManagement } from "@/actions/roles";
import AccessClient from "./AccessClient";

export const dynamic = 'force-dynamic';

export default async function AccessManagementPage() {
  const users = await getUsersForAccessManagement();
  
  // لیست تمام صفحات سایت (شامل زیرمنوها)
  const allRoutes = [
    "/dashboard", 
    "/dashboard/profile", 
    "/dashboard/attendance", 
    "/dashboard/leave", 
    "/dashboard/my-projects", 
    "/dashboard/my-missions", 
    "/dashboard/my-tasks", 
    "/dashboard/projects", 
    "/dashboard/missions", 
    "/dashboard/tasks", 
    "/dashboard/personnel", 
    "/dashboard/leave-approvals", 
    "/dashboard/calendar", 
    "/dashboard/payroll-settings", 
    "/dashboard/my-work-hours",
    "/dashboard/activity-settings",
    "/dashboard/hours-settings",
    "/dashboard/roles",
    "/dashboard/access-management"
  ];

  return <AccessClient users={users} allRoutes={allRoutes} />;
}