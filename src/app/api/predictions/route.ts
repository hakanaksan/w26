import { NextResponse } from 'next/server';
import { client } from '@/lib/db-client';
import { verifyToken } from '@/lib/auth';

async function getUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return verifyToken(authHeader.substring(7));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');

  if (matchId) {
    try {
      const result = await client.execute({
        sql: `SELECT p.user_id, p.home_score, p.away_score, u.name as user_name 
              FROM predictions p 
              JOIN users u ON p.user_id = u.id 
              WHERE p.match_id = ?`,
        args: [matchId]
      });

      const scoreResult = await client.execute({
        sql: 'SELECT home_score, away_score, is_completed FROM match_scores WHERE match_id = ?',
        args: [matchId]
      });

      let score: { home: number; away: number; isCompleted: boolean } | null = null;
      if (scoreResult.rows.length > 0) {
        score = {
          home: scoreResult.rows[0].home_score as number,
          away: scoreResult.rows[0].away_score as number,
          isCompleted: scoreResult.rows[0].is_completed === 1
        };
      }

      const predictions = result.rows.map(row => {
        const predHome = row.home_score as number;
        const predAway = row.away_score as number;
        let points = 0;
        let hasPoints = false;

        if (score && score.isCompleted) {
          hasPoints = true;
          if (predHome === score.home && predAway === score.away) {
            points = 3;
          } else {
            const predOutcome = predHome > predAway ? 'home' : predHome < predAway ? 'away' : 'draw';
            const actualOutcome = score.home > score.away ? 'home' : score.home < score.away ? 'away' : 'draw';
            if (predOutcome === actualOutcome) {
              points = 2;
            } else if (predHome === score.home || predAway === score.away) {
              points = 1;
            } else {
              points = 0;
            }
          }
        }

        return {
          userId: row.user_id as string,
          userName: row.user_name as string,
          homeScore: predHome,
          awayScore: predAway,
          points,
          hasPoints
        };
      });

      return NextResponse.json({ predictions });
    } catch (err) {
      console.error('Predictions match detail error:', err);
      return NextResponse.json({ predictions: [] });
    }
  }

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