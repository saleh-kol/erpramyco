import { getPersonnelForHours } from '@/actions/hoursSettings'
import HoursSettingsClient from './HoursSettingsClient'

export default async function HoursSettingsPage() {
  const personnel = await getPersonnelForHours();
  return <HoursSettingsClient personnel={personnel} />
}