import { getMyProfile } from '@/actions/profile'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const profile = await getMyProfile();
  if (!profile) return <div style={{ padding: "24px" }}>پروفایل یافت نشد</div>;
  return <ProfileClient profile={profile} />
}