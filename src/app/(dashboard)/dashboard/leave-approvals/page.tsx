import { getAllLeaveRequests } from '@/actions/leave';
import { getProjectsForApproval } from '@/actions/myProjects';
import { getPendingMissions } from '@/actions/myMissions';
import LeaveApprovalsClient from './LeaveApprovalsClient';

export default async function LeaveApprovalsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const currentStatus = status || 'Pending';
  
  const [requests, projects, missions] = await Promise.all([
    getAllLeaveRequests(currentStatus),
    getProjectsForApproval(currentStatus),
    getPendingMissions()
  ]);

  return <LeaveApprovalsClient requests={requests} currentStatus={currentStatus} projects={projects} missions={missions} />;
}