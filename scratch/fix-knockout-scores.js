const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

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
  const correctScores = [
    { matchId: 'M073', home: 0, away: 1, homePen: null, awayPen: null },
    { matchId: 'M074', home: 1, away: 1, homePen: 4, awayPen: 5 },
    { matchId: 'M075', home: 1, away: 1, homePen: 3, awayPen: 5 },
    { matchId: 'M076', home: 2, away: 1, homePen: null, awayPen: null },
    { matchId: 'M077', home: 3, away: 0, homePen: null, awayPen: null },
    { matchId: 'M078', home: 1, away: 2, homePen: null, awayPen: null },
    { matchId: 'M079', home: 2, away: 0, homePen: null, awayPen: null },
    { matchId: 'M080', home: 2, away: 1, homePen: null, awayPen: null },
    { matchId: 'M081', home: 2, away: 0, homePen: null, awayPen: null },
    { matchId: 'M082', home: 2, away: 2, homePen: 3, awayPen: 2 },
    { matchId: 'M083', home: 2, away: 1, homePen: null, awayPen: null },
    { matchId: 'M101', home: 2, away: 0, homePen: null, awayPen: null },
    { matchId: 'M104', home: 1, away: 1, homePen: 2, awayPen: 4 },
  ];

  for (const s of correctScores) {
    // Check if score exists
    const check = await client.execute({
      sql: "SELECT id FROM match_scores WHERE match_id = ?",
      args: [s.matchId]
    });

    if (check.rows.length > 0) {
      await client.execute({
        sql: "UPDATE match_scores SET home_score = ?, away_score = ?, home_penalty_score = ?, away_penalty_score = ?, is_completed = 1, updated_at = ? WHERE match_id = ?",
        args: [s.home, s.away, s.homePen, s.awayPen, new Date().toISOString(), s.matchId]
      });
      console.log(`Updated match ${s.matchId} score in DB.`);
    } else {
      const id = `score_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      await client.execute({
        sql: "INSERT INTO match_scores (id, match_id, home_score, away_score, home_penalty_score, away_penalty_score, is_completed, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
        args: [id, s.matchId, s.home, s.away, s.homePen, s.awayPen, new Date().toISOString()]
      });
      console.log(`Inserted match ${s.matchId} score in DB.`);
    }
  }

  const verify = await client.execute("SELECT match_id, home_score, away_score, home_penalty_score, away_penalty_score FROM match_scores WHERE match_id >= 'M073' ORDER BY match_id");
  console.log('\nVerified Knockout Scores in DB:', verify.rows);
}

main().catch(console.error);
