import { getHolidays } from '@/actions/calendar'
import CalendarClient from './CalendarClient'

export default async function CalendarPage() {
  const holidays = await getHolidays();
  return <CalendarClient holidays={holidays} />
}