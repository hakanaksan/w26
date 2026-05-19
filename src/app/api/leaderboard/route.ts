import { NextResponse } from 'next/server';
import { client } from '@/lib/db-client';

export async function GET() {
  try {
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

    leaderboard.sort((a, b) => b.points - a.points || a.completedPredictions - b.completedPredictions);

    return NextResponse.json({ leaderboard });
  } catch (err) {
    return NextResponse.json({ leaderboard: [] });
  }
}