import { NextResponse } from 'next/server';
import { client } from '@/lib/db-client';
import { verifyToken } from '@/lib/auth';

async function getUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return verifyToken(authHeader.substring(7));
}

export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const result = await client.execute({ sql: 'SELECT * FROM user_notifications WHERE user_id = ? AND is_active = 1', args: [user.userId] });
  return NextResponse.json({ notifications: result.rows });
}

export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const { matchId, type, minutesBefore } = await request.json();

  if (!matchId || !type || minutesBefore === undefined) {
    return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
  }

  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const createdAt = new Date().toISOString();

  await client.execute({
    sql: 'INSERT INTO user_notifications (id, user_id, match_id, type, minutes_before, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)',
    args: [id, user.userId, matchId, type, minutesBefore, createdAt],
  });

  return NextResponse.json({ id, matchId, type, minutesBefore });
}

export async function DELETE(request: Request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const { notificationId } = await request.json();

  if (!notificationId) {
    return NextResponse.json({ error: 'notificationId gerekli' }, { status: 400 });
  }

  await client.execute({
    sql: 'DELETE FROM user_notifications WHERE id = ? AND user_id = ?',
    args: [notificationId, user.userId],
  });

  return NextResponse.json({ success: true });
}