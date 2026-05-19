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

  const result = await client.execute({ sql: 'SELECT * FROM predictions WHERE user_id = ?', args: [user.userId] });

  const predictions: Record<string, { homeScore: number; awayScore: number }> = {};
  for (const row of result.rows) {
    predictions[row.match_id as string] = {
      homeScore: row.home_score as number,
      awayScore: row.away_score as number,
    };
  }

  return NextResponse.json({ predictions });
}

export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const { matchId, homeScore, awayScore } = await request.json();

  if (!matchId || homeScore === undefined || awayScore === undefined) {
    return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
  }

  const id = `pred_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  await client.execute({
    sql: `INSERT INTO predictions (id, user_id, match_id, home_score, away_score, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, match_id) DO UPDATE SET
            home_score = excluded.home_score,
            away_score = excluded.away_score,
            updated_at = excluded.updated_at`,
    args: [id, user.userId, matchId, homeScore, awayScore, now, now],
  });

  return NextResponse.json({ id, matchId, homeScore, awayScore });
}

export async function DELETE(request: Request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const { matchId } = await request.json();
  if (!matchId) return NextResponse.json({ error: 'matchId gerekli' }, { status: 400 });

  await client.execute({
    sql: 'DELETE FROM predictions WHERE user_id = ? AND match_id = ?',
    args: [user.userId, matchId],
  });

  return NextResponse.json({ success: true });
}