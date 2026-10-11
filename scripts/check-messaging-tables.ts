/**
 * Check if messaging tables exist in database
 */

import { supabaseAdmin } from '../lib/supabase';

async function checkTables() {
  console.log('🔍 Checking messaging tables...\n');

  if (!supabaseAdmin) {
    console.error('❌ Supabase admin client not configured');
    process.exit(1);
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
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: NOT FOUND`);
        console.log(`   Error: ${error.message}`);
      } else {
        console.log(`✅ ${table}: EXISTS (${data?.length || 0} rows)`);
      }
    }

    console.log('\n💡 If tables are missing, you need to run the migration:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Copy content from: supabase/migrations/012_create_messaging_system.sql');
    console.log('   3. Paste and run it');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

checkTables().catch(console.error);
