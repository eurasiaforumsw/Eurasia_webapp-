/** Apply all pending migrations to Neon through the shared migration runner. */
import 'dotenv/config';
// push-schema.js is a CommonJS utility with no separate declaration file.
// @ts-expect-error -- its exported runtime API is validated by the JS module.
import { pushSchema } from './push-schema.js';

async function applyMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Set it in .env or the shell environment.');
  }

  console.log('🚀 Applying pending migrations to Neon...\n');
  const summary = await pushSchema({ databaseUrl: process.env.DATABASE_URL });
  console.log(`\n✅ Schema is up to date. Applied ${summary.applied}, skipped ${summary.skipped}.`);
}

applyMigration().catch((error) => {
  console.error('❌ Migration failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
