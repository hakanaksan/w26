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
  const res = await client.execute("UPDATE match_scores SET home_score = 2, away_score = 2, home_penalty_score = 3, away_penalty_score = 2 WHERE match_id = 'M082'");
  console.log('Update result success');
  
  const verify = await client.execute("SELECT * FROM match_scores WHERE match_id = 'M082'");
  console.log('Updated score in DB:', verify.rows);
}

main().catch(console.error);
