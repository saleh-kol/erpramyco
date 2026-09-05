import { getPersonnel } from '@/actions/personnel'
import PersonnelClient from './PersonnelClient'

export default async function PersonnelPage() {
  const personnel = await getPersonnel()

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">مدیریت پرسنل</h1>
      <PersonnelClient personnel={personnel} />
    </div>
  )
}