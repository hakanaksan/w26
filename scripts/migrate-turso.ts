import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://w26-hakanaksan.aws-eu-west-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzkxMzQ0ODgsImlkIjoiMDE5ZTNjOTctZmUwMS03MjZiLWEzY2MtYTc5OTE5YTA0ZjFhIiwicmlkIjoiNWQzY2RlOTMtZTVmMi00NmIzLTlkMmUtZmFjYzY4MzhiNDUyIn0.nVpJI68rvxQFS7LresQ1-eaQMFph-eabeWgRzrUYZUIrnPnq4WYWi-tzBoFHw3_WilZ7HxMq7FpYpuH8P9hTBg',
});

async function migrate() {
  console.log('Creating tables on Turso...');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  console.log('✓ users table');

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
  console.log('✓ predictions table');

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
  console.log('✓ match_scores table');

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
  console.log('✓ user_notifications table');

  console.log('\nMigration complete! All tables created on Turso.');
  client.close();
}

migrate().catch(e => { console.error('Migration failed:', e); process.exit(1); });