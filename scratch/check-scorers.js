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
  const res = await client.execute({
    sql: 'SELECT * FROM scorers WHERE match_id >= ? ORDER BY match_id',
    args: ['M073']
  });
  console.log('Scorers for match_id >= M073:', res.rows);
}

main().catch(console.error);
