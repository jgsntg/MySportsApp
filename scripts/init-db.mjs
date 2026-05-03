import { createClient } from '@libsql/client';
import path from 'path';

const url = process.env.TURSO_DATABASE_URL ?? `file:${path.join(process.cwd(), 'mysports.db')}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

await client.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  )
`);

await client.execute(`
  CREATE TABLE IF NOT EXISTS favorite_teams (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    sport TEXT NOT NULL,
    league TEXT NOT NULL,
    team_name TEXT NOT NULL,
    team_logo TEXT,
    team_color TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, team_id, sport)
  )
`);

await client.execute(`
  CREATE TABLE IF NOT EXISTS favorite_players (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    sport TEXT NOT NULL,
    league TEXT NOT NULL,
    player_name TEXT NOT NULL,
    player_photo TEXT,
    team_name TEXT,
    position TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, player_id, sport)
  )
`);

console.log('✓ Database tables initialized');
process.exit(0);
