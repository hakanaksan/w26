import { NextResponse } from 'next/server';
import { client } from '@/lib/db-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const userResult = await client.execute({ sql: 'SELECT id, name FROM users WHERE id = ?', args: [userId] });
      if (userResult.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const predResult = await client.execute({ sql: 'SELECT match_id, home_score, away_score FROM predictions WHERE user_id = ?', args: [userId] });
      const predictions: Record<string, { homeScore: number; awayScore: number }> = {};
      for (const row of predResult.rows) {
        predictions[row.match_id as string] = { homeScore: row.home_score as number, awayScore: row.away_score as number };
      }

      const scoresResult = await client.execute('SELECT match_id, home_score, away_score, is_completed FROM match_scores WHERE is_completed = 1');
      const scores: Record<string, { home: number; away: number }> = {};
      for (const row of scoresResult.rows) {
        scores[row.match_id as string] = { home: row.home_score as number, away: row.away_score as number };
      }

      let exact = 0, close = 0, missed = 0;
      for (const [matchId, pred] of Object.entries(predictions)) {
        const score = scores[matchId];
        if (!score) continue;
        if (pred.homeScore === score.home && pred.awayScore === score.away) exact++;
        else if (pred.homeScore === score.home || pred.awayScore === score.away || (pred.homeScore - pred.awayScore === score.home - score.away)) close++;
        else missed++;
      }

      return NextResponse.json({
        user: { id: userResult.rows[0].id, name: userResult.rows[0].name },
        predictions,
        stats: { total: Object.keys(predictions).length, exact, close, missed, points: exact * 3 + close },
      });
    }

    const usersResult = await client.execute('SELECT id, name FROM users');
    const predictionsResult = await client.execute('SELECT user_id, match_id, home_score, away_score FROM predictions');
    const scoresResult = await client.execute('SELECT match_id, home_score, away_score, is_completed FROM match_scores WHERE is_completed = 1');

    const scores: Record<string, { home: number; away: number }> = {};
    for (const row of scoresResult.rows) {
      scores[row.match_id as string] = { home: row.home_score as number, away: row.away_score as number };
    }

    const predictionsByUser: Record<string, Record<string, { home: number; away: number }>> = {};
    for (const row of predictionsResult.rows) {
      const uid = row.user_id as string;
      const mid = row.match_id as string;
      if (!predictionsByUser[uid]) predictionsByUser[uid] = {};
      predictionsByUser[uid][mid] = { home: row.home_score as number, away: row.away_score as number };
    }

    const leaderboard = usersResult.rows.map(user => {
      const uid = user.id as string;
      const userPreds = predictionsByUser[uid] || {};
      let exact = 0;
      let close = 0;
      let missed = 0;
      let totalPredictions = Object.keys(userPreds).length;

      for (const [matchId, pred] of Object.entries(userPreds)) {
        const score = scores[matchId];
        if (!score) continue;
        if (pred.home === score.home && pred.away === score.away) { exact++; }
        else if (pred.home === score.home || pred.away === score.away || (pred.home - pred.away === score.home - score.away)) { close++; }
        else { missed++; }
      }

      const points = exact * 3 + close * 1;
      const completedPredictions = Object.keys(userPreds).filter(mid => scores[mid]).length;

      return {
        userId: uid,
        name: user.name as string,
        totalPredictions,
        completedPredictions,
        exact,
        close,
        missed,
        points,
      };
    });

    leaderboard.sort((a, b) => b.points - a.points || b.totalPredictions - a.totalPredictions);

    return NextResponse.json({ leaderboard });
  } catch (err) {
    console.error('Leaderboard error:', err);
    return NextResponse.json({ leaderboard: [] });
  }
}