import { getPersonnelDetails } from '@/actions/personnelDetails'
import PersonnelDetailClient from './PersonnelDetailClient'

// اضافه شدن await به params و searchParams
export default async function PersonnelDetailPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>, 
  searchParams: Promise<{ start?: string, end?: string }> 
}) {
  // دریافت مقادیر از Promise
  const { id } = await params
  const { start, end } = await searchParams

  const data = await getPersonnelDetails(id, start, end)

  if (!data) return <div>پرسنل یافت نشد</div>

  return <PersonnelDetailClient data={data} searchParams={{ start, end }} />
}