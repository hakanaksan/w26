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

  const result = await client.execute({ sql: 'SELECT * FROM favorites WHERE user_id = ?', args: [user.userId] });
  const favorites: string[] = result.rows.map(r => r.match_id as string);
  return NextResponse.json({ favorites });
}

export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const { matchId } = await request.json();
  if (!matchId) return NextResponse.json({ error: 'matchId gerekli' }, { status: 400 });

  const existing = await client.execute({ sql: 'SELECT id FROM favorites WHERE user_id = ? AND match_id = ?', args: [user.userId, matchId] });
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'Zaten favoride' }, { status: 409 });
  }

  const id = `fav_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const createdAt = new Date().toISOString();

  await client.execute({
    sql: 'INSERT INTO favorites (id, user_id, match_id, created_at) VALUES (?, ?, ?, ?)',
    args: [id, user.userId, matchId, createdAt],
  });

  return NextResponse.json({ id, matchId });
}

export async function DELETE(request: Request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const { matchId } = await request.json();
  if (!matchId) return NextResponse.json({ error: 'matchId gerekli' }, { status: 400 });

  await client.execute({
    sql: 'DELETE FROM favorites WHERE user_id = ? AND match_id = ?',
    args: [user.userId, matchId],
  });

  return NextResponse.json({ success: true });
}