/** Backwards-compatible Neon migration command. */
import 'dotenv/config';
// push-schema.js is a CommonJS utility with no separate declaration file.
// @ts-expect-error -- its exported runtime API is validated by the JS module.
import { pushSchema } from './push-schema.js';

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Set it in .env or the shell environment.');
  }

  console.log('🚀 Running pending migrations on Neon...\n');
  const summary = await pushSchema({ databaseUrl: process.env.DATABASE_URL });
  console.log(`\n✅ Migration run completed. Applied ${summary.applied}, skipped ${summary.skipped}.`);
}

runMigration().catch((error) => {
  console.error('❌ Migration failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
