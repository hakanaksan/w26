import { NextResponse } from 'next/server';
import { client } from '@/lib/db-client';

export const dynamic = 'force-dynamic';

function calculatePredictionPoints(
  predHome: number, predAway: number, predHomePen: number | undefined, predAwayPen: number | undefined,
  actualHome: number, actualAway: number, actualHomePen: number | undefined, actualAwayPen: number | undefined,
  isKnockout: boolean
): 'exact' | 'outcome' | 'goalCount' | 'missed' {
  const isRegularExact = predHome === actualHome && predAway === actualAway;
  const isExact = isKnockout && actualHome === actualAway
    ? isRegularExact && predHomePen !== undefined && actualHomePen !== undefined && predHomePen === actualHomePen && predAwayPen === actualAwayPen
    : isRegularExact;

  if (isExact) return 'exact';

  const predWinner = predHome > predAway ? 'home' : (predHome < predAway ? 'away' : (predHomePen !== undefined && predAwayPen !== undefined && predHomePen > predAwayPen ? 'home' : 'away'));
  const actualWinner = actualHome > actualAway ? 'home' : (actualHome < actualAway ? 'away' : (actualHomePen !== undefined && actualAwayPen !== undefined && actualHomePen > actualAwayPen ? 'home' : 'away'));

  if (isKnockout) {
    if (predWinner === actualWinner || (predHome === predAway && actualHome === actualAway)) return 'outcome';
  } else {
    const predOutcome = predHome > predAway ? 'home' : (predHome < predAway ? 'away' : 'draw');
    const actualOutcome = actualHome > actualAway ? 'home' : (actualHome < actualAway ? 'away' : 'draw');
    if (predOutcome === actualOutcome) return 'outcome';
  }

  if (predHome === actualHome || predAway === actualAway) return 'goalCount';

  return 'missed';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const userResult = await client.execute({ sql: 'SELECT id, name FROM users WHERE id = ?', args: [userId] });
      if (userResult.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const predResult = await client.execute({ sql: 'SELECT match_id, home_score, away_score, home_penalty_score, away_penalty_score FROM predictions WHERE user_id = ?', args: [userId] });
      const predictions: Record<string, { homeScore: number; awayScore: number; homePenaltyScore?: number; awayPenaltyScore?: number }> = {};
      for (const row of predResult.rows) {
        predictions[row.match_id as string] = {
          homeScore: row.home_score as number,
          awayScore: row.away_score as number,
          homePenaltyScore: row.home_penalty_score !== null && row.home_penalty_score !== undefined ? (row.home_penalty_score as number) : undefined,
          awayPenaltyScore: row.away_penalty_score !== null && row.away_penalty_score !== undefined ? (row.away_penalty_score as number) : undefined
        };
      }

      const scoresResult = await client.execute('SELECT match_id, home_score, away_score, home_penalty_score, away_penalty_score, is_completed FROM match_scores WHERE is_completed = 1');
      const scores: Record<string, { home: number; away: number; homePenalty?: number; awayPenalty?: number }> = {};
      for (const row of scoresResult.rows) {
        scores[row.match_id as string] = {
          home: row.home_score as number,
          away: row.away_score as number,
          homePenalty: row.home_penalty_score !== null && row.home_penalty_score !== undefined ? (row.home_penalty_score as number) : undefined,
          awayPenalty: row.away_penalty_score !== null && row.away_penalty_score !== undefined ? (row.away_penalty_score as number) : undefined
        };
      }

      let exact = 0, outcome = 0, goalCount = 0, missed = 0;
      let extraPenaltyPoints = 0;
      for (const [matchId, pred] of Object.entries(predictions)) {
        const score = scores[matchId];
        if (!score) continue;
        const result = calculatePredictionPoints(
          pred.homeScore, pred.awayScore, pred.homePenaltyScore, pred.awayPenaltyScore,
          score.home, score.away, score.homePenalty, score.awayPenalty,
          matchId >= 'M073'
        );
        if (result === 'exact') exact++;
        else if (result === 'outcome') outcome++;
        else if (result === 'goalCount') goalCount++;
        else missed++;

        // Calculate extra penalty points
        if (matchId >= 'M081' && score.home === score.away && pred.homeScore === pred.awayScore) {
          const predWinner = pred.homeScore > pred.awayScore ? 'home' : (pred.homeScore < pred.awayScore ? 'away' : (pred.homePenaltyScore !== undefined && pred.awayPenaltyScore !== undefined && pred.homePenaltyScore > pred.awayPenaltyScore ? 'home' : 'away'));
          const actualWinner = score.home > score.away ? 'home' : (score.home < score.away ? 'away' : (score.homePenalty !== undefined && score.awayPenalty !== undefined && score.homePenalty > score.awayPenalty ? 'home' : 'away'));
          if (predWinner === actualWinner) {
            extraPenaltyPoints += 3;
          }
        }
      }

      return NextResponse.json({
        user: { id: userResult.rows[0].id, name: userResult.rows[0].name },
        predictions,
        stats: { total: Object.keys(predictions).length, exact, outcome, goalCount, missed, points: exact * 3 + outcome * 2 + goalCount + extraPenaltyPoints },
      });
    }

    const usersResult = await client.execute('SELECT id, name FROM users');
    const predictionsResult = await client.execute('SELECT user_id, match_id, home_score, away_score, home_penalty_score, away_penalty_score FROM predictions');
    const scoresResult = await client.execute('SELECT match_id, home_score, away_score, home_penalty_score, away_penalty_score, is_completed FROM match_scores WHERE is_completed = 1');

    const scores: Record<string, { home: number; away: number; homePenalty?: number; awayPenalty?: number }> = {};
    for (const row of scoresResult.rows) {
      scores[row.match_id as string] = {
        home: row.home_score as number,
        away: row.away_score as number,
        homePenalty: row.home_penalty_score !== null && row.home_penalty_score !== undefined ? (row.home_penalty_score as number) : undefined,
        awayPenalty: row.away_penalty_score !== null && row.away_penalty_score !== undefined ? (row.away_penalty_score as number) : undefined
      };
    }

    const predictionsByUser: Record<string, Record<string, { home: number; away: number; homePenalty?: number; awayPenalty?: number }>> = {};
    for (const row of predictionsResult.rows) {
      const uid = row.user_id as string;
      const mid = row.match_id as string;
      if (!predictionsByUser[uid]) predictionsByUser[uid] = {};
      predictionsByUser[uid][mid] = {
        home: row.home_score as number,
        away: row.away_score as number,
        homePenalty: row.home_penalty_score !== null && row.home_penalty_score !== undefined ? (row.home_penalty_score as number) : undefined,
        awayPenalty: row.away_penalty_score !== null && row.away_penalty_score !== undefined ? (row.away_penalty_score as number) : undefined
      };
    }

    const leaderboard = usersResult.rows.map(user => {
      const uid = user.id as string;
      const userPreds = predictionsByUser[uid] || {};
      let exact = 0;
      let outcome = 0;
      let goalCount = 0;
      let missed = 0;
      let extraPenaltyPoints = 0;
      let totalPredictions = Object.keys(userPreds).length;

      for (const [matchId, pred] of Object.entries(userPreds)) {
        const score = scores[matchId];
        if (!score) continue;
        const result = calculatePredictionPoints(
          pred.home, pred.away, pred.homePenalty, pred.awayPenalty,
          score.home, score.away, score.homePenalty, score.awayPenalty,
          matchId >= 'M073'
        );
        if (result === 'exact') exact++;
        else if (result === 'outcome') outcome++;
        else if (result === 'goalCount') goalCount++;
        else missed++;

        // Calculate extra penalty points
        if (matchId >= 'M081' && score.home === score.away && pred.home === pred.away) {
          const predWinner = pred.home > pred.away ? 'home' : (pred.home < pred.away ? 'away' : (pred.homePenalty !== undefined && pred.awayPenalty !== undefined && pred.homePenalty > pred.awayPenalty ? 'home' : 'away'));
          const actualWinner = score.home > score.away ? 'home' : (score.home < score.away ? 'away' : (score.homePenalty !== undefined && score.awayPenalty !== undefined && score.homePenalty > score.awayPenalty ? 'home' : 'away'));
          if (predWinner === actualWinner) {
            extraPenaltyPoints += 3;
          }
        }
      }

      const points = exact * 3 + outcome * 2 + goalCount + extraPenaltyPoints;
      const completedPredictions = Object.keys(userPreds).filter(mid => scores[mid]).length;

      return {
        userId: uid,
        name: user.name as string,
        totalPredictions,
        completedPredictions,
        exact,
        outcome,
        goalCount,
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