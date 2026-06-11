import { NextResponse } from 'next/server';
import { client } from '@/lib/db-client';

export async function GET() {
  try {
    const result = await client.execute('SELECT * FROM match_scores');
    const scores: Record<string, { homeScore: number; awayScore: number; isCompleted: boolean }> = {};
    for (const row of result.rows) {
      scores[row.match_id as string] = {
        homeScore: row.home_score as number,
        awayScore: row.away_score as number,
        isCompleted: (row.is_completed as number) === 1,
      };
    }
    return NextResponse.json({ scores });
  } catch {
    return NextResponse.json({ scores: {} });
  }
}

export async function POST(request: Request) {
  const { matchId, homeScore, awayScore, isCompleted: isCompletedRaw } = await request.json();

  if (!matchId || homeScore === undefined || awayScore === undefined) {
    return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
  }

  const isCompleted = isCompletedRaw === false ? 0 : 1;

  const id = `score_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  await client.execute({
    sql: `INSERT INTO match_scores (id, match_id, home_score, away_score, is_completed, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(match_id) DO UPDATE SET
            home_score = excluded.home_score,
            away_score = excluded.away_score,
            is_completed = excluded.is_completed,
            updated_at = excluded.updated_at`,
    args: [id, matchId, homeScore, awayScore, isCompleted, now],
  });

  return NextResponse.json({ id, matchId, homeScore, awayScore, isCompleted: isCompleted === 1 });
}

export async function DELETE(request: Request) {
  const { matchId } = await request.json();

  if (!matchId) {
    return NextResponse.json({ error: 'matchId gerekli' }, { status: 400 });
  }

  await client.execute({
    sql: 'DELETE FROM match_scores WHERE match_id = ?',
    args: [matchId],
  });

  return NextResponse.json({ success: true });
}