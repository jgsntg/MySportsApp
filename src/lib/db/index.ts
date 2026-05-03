import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const url = process.env.TURSO_DATABASE_URL ?? `file:${process.cwd()}/mysports.db`;
const authToken = process.env.TURSO_AUTH_TOKEN;

const globalForDb = globalThis as unknown as {
  _libsql: ReturnType<typeof createClient> | undefined;
};

const client = globalForDb._libsql ?? createClient({ url, authToken });

if (process.env.NODE_ENV !== 'production') {
  globalForDb._libsql = client;
}

export const db = drizzle(client, { schema });
export { client };
