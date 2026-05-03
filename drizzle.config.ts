export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? 'file:./mysports.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
};
