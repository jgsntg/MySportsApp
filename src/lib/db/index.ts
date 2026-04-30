import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import path from 'path';

const DB_URL = `file:${path.join(process.cwd(), 'mysports.db')}`;

// Preserve connection across Next.js hot reloads in development
const globalForDb = globalThis as unknown as {
  _libsql: ReturnType<typeof createClient> | undefined;
};

const client = globalForDb._libsql ?? createClient({ url: DB_URL });

if (process.env.NODE_ENV !== 'production') {
  globalForDb._libsql = client;
}

export const db = drizzle(client, { schema });
export { client };
