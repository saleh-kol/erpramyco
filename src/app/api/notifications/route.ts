import { NextResponse } from 'next/server'
import { getMyNotifications } from '@/actions/leave'

export async function GET() {
  try {
    const notifications = await getMyNotifications();
    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}