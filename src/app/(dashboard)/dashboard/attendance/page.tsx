import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getMyActiveActivity, getActivityFormOptions } from '@/actions/activity'
import ActivityClient from './ActivityClient'

export default async function AttendancePage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  
  if (!sessionCookie) return null
  
  // خواندن سشن امن (JWT)
  const user = await verifySession(sessionCookie.value)
  if (!user) return null
  
  const dbUser = await prisma.users.findUnique({
    where: { User_ID: user.userId },
    include: { Personnel: true }
  });

  const personnel = dbUser?.Personnel;
  const fullName = personnel?.Full_Name || user.name;
  const imagePath = personnel?.Personal_Image_Path;
  
  const activeActivity = await getMyActiveActivity();
  const { types, locations, projects, tasks, missions } = await getActivityFormOptions();

  return (
    <ActivityClient 
      user={{ name: fullName, image: imagePath }} 
      activeActivity={activeActivity}
      types={types}
      locations={locations}
      projects={projects}
      tasks={tasks}
      missions={missions}
    />
  )
}