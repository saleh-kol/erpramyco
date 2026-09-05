import { getPersonnelForPayroll } from '@/actions/payrollSettings'
import PayrollSettingsClient from './PayrollSettingsClient'

export default async function PayrollSettingsPage() {
  const personnel = await getPersonnelForPayroll();
  return <PayrollSettingsClient personnel={personnel} />
}