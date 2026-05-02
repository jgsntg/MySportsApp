export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  driver: 'libsql',
  dbCredentials: {
    url: 'file:./mysports.db',
  },
};
