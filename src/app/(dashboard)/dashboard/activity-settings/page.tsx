import { getWorkTypesAndLocations } from '@/actions/activitySettings'
import ActivitySettingsClient from './ActivitySettingsClient'

export default async function ActivitySettingsPage() {
  const { types, locations } = await getWorkTypesAndLocations();
  return <ActivitySettingsClient types={types} locations={locations} />
}