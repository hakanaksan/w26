import { NextResponse } from 'next/server';

const notifications: Record<string, any[]> = {};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');

  if (matchId) {
    return NextResponse.json(notifications[matchId] || []);
  }

  return NextResponse.json(notifications);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { matchId, type, minutesBefore } = body;

  if (!notifications[matchId]) {
    notifications[matchId] = [];
  }

  const notification = {
    id: `notif_${Date.now()}`,
    matchId,
    type,
    minutesBefore,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  notifications[matchId].push(notification);

  return NextResponse.json(notification);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const notificationId = searchParams.get('id');

  for (const matchId in notifications) {
    notifications[matchId] = notifications[matchId].filter(
      (n: any) => n.id !== notificationId
    );
  }

  return NextResponse.json({ success: true });
}
