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
  const ids = ['M081', 'M084', 'M101'];
  for (const id of ids) {
    const scs = await client.execute(`SELECT * FROM scorers WHERE match_id = '${id}'`);
    console.log(`Scorers in DB for ${id}:`, scs.rows);
  }
}

main().catch(console.error);
