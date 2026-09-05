import { getLeaveTypes, getMyLeaveRequests } from '@/actions/leave'
import LeaveClient from './LeaveClient'

export default async function LeavePage({ searchParams }: { searchParams: Promise<{ start?: string, end?: string }> }) {
  const { start, end } = await searchParams;
  const [types, requests] = await Promise.all([
    getLeaveTypes(),
    getMyLeaveRequests(start, end)
  ]);

  return <LeaveClient types={types} requests={requests} searchParams={{ start, end }} />
}