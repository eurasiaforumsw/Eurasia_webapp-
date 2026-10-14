/** Check whether the messaging tables exist in Neon. */
import 'dotenv/config';
import { query } from '../lib/db';

async function checkTables() {
  console.log('🔍 Checking messaging tables...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not configured');
    process.exitCode = 1;
    return;
  }

  try {
    // Try to query each table
    const tables = [
      'conversations',
      'conversation_participants',
      'messages',
      'message_rate_limits',
      'member_suspensions',
    ];

    for (const table of tables) {
      try {
        const result = await query<{ exists: boolean }>(
          `SELECT EXISTS (
             SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = $1
           ) AS exists`,
          [table],
        );
        const status = result.rows[0];
        if (!status?.exists) {
          console.log(`❌ ${table}: NOT FOUND`);
        } else {
          const count = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM public.${table}`);
          console.log(`✅ ${table}: EXISTS (${count.rows[0]?.count || '0'} rows)`);
        }
      } catch (error) {
        console.log(`❌ ${table}: NOT FOUND`);
        console.log(`   Error: ${error instanceof Error ? error.message : error}`);
      }
    }

    console.log('\n💡 If tables are missing, run: node scripts/push-schema.js');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

checkTables().catch(console.error);
