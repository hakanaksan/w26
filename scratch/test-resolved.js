const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
const { matches: scheduledMatches } = require('../src/data/fixtures');
const { resolveRealBracket } = require('../src/data/bracket');

// Read .env.local
const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const client = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

async function main() {
  const scoresResult = await client.execute('SELECT * FROM match_scores');
  const dbScores = {};
  for (const row of scoresResult.rows) {
    dbScores[row.match_id] = {
      homeScore: row.home_score,
      awayScore: row.away_score,
      homePenaltyScore: row.home_penalty_score,
      awayPenaltyScore: row.away_penalty_score,
      isCompleted: row.is_completed === 1
    };
  }

  const mergedMatches = scheduledMatches.map(m => {
    const s = dbScores[m.id];
    if (s) {
      return {
        ...m,
        homeScore: s.homeScore,
        awayScore: s.awayScore,
        homePenaltyScore: s.homePenaltyScore,
        awayPenaltyScore: s.awayPenaltyScore,
        isCompleted: s.isCompleted,
      };
    }
    return m;
  });

  const resolvedSlots = resolveRealBracket(mergedMatches);
  const m74 = resolvedSlots.find(s => s.matchId === 'M074');
  const m75 = resolvedSlots.find(s => s.matchId === 'M075');
  console.log('M074 Slot:', m74);
  console.log('M075 Slot:', m75);
}

main().catch(console.error);
