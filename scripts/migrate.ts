import { createClient } from '@libsql/client';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'local.db');

const client = createClient({ url: `file:${DB_PATH}` });

async function migrate() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      match_id TEXT NOT NULL,
      home_score INTEGER NOT NULL,
      away_score INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, match_id)
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS match_scores (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL UNIQUE,
      home_score INTEGER NOT NULL,
      away_score INTEGER NOT NULL,
      is_completed INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS user_notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      match_id TEXT NOT NULL,
      type TEXT NOT NULL,
      minutes_before INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  console.log('Migration complete! DB at:', DB_PATH);
  client.close();
}

migrate().catch(console.error);