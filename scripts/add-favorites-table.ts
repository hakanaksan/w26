import { createClient } from '@libsql/client';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      process.env[key] = value;
    }
  }
}

loadEnv();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function migrate() {
  console.log('Creating favorites table on Turso...');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      match_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, match_id)
    );
  `);

  console.log('✓ favorites table');
  console.log('\nMigration complete!');
  client.close();
}

migrate().catch(e => { console.error('Migration failed:', e); process.exit(1); });