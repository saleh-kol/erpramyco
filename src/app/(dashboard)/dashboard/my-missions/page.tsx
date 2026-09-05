import { getMyMissions } from '@/actions/myMissions'
import MyMissionsClient from './MyMissionsClient'

export default async function MyMissionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusParam } = await searchParams;
  
  // لیست وضعیت‌های جدید
  const validStatuses = ['pending', 'inprogress', 'completed', 'rejected'];
  const status: string = (statusParam && validStatuses.includes(statusParam)) ? statusParam : 'pending';

  const missions = await getMyMissions(status as any);
  return <MyMissionsClient missions={missions} currentStatus={status} />
}