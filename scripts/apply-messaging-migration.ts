/**
 * Apply messaging system migration using Supabase admin client
 * This bypasses the need for direct PostgreSQL credentials
 */

import { supabaseAdmin } from '../lib/supabase';

async function applyMigration() {
  console.log('🚀 Applying messaging system migration...\n');

  if (!supabaseAdmin) {
    console.error('❌ Supabase admin client not configured');
    process.exit(1);
  }

  try {
    console.log('📝 Creating tables...\n');

    // Execute migration statements one by one
    const statements = [
      // Table 1: conversations
      `CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        title TEXT,
        is_group BOOLEAN DEFAULT false,
        created_by TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_message_at TIMESTAMPTZ,
        last_message_preview TEXT
      )`,

      // Table 2: conversation_participants
      `CREATE TABLE IF NOT EXISTS conversation_participants (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'member',
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(conversation_id, member_id)
      )`,

      // Table 3: messages
      `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        is_deleted BOOLEAN DEFAULT false,
        deleted_at TIMESTAMPTZ
      )`,

      // Table 4: message_rate_limits
      `CREATE TABLE IF NOT EXISTS message_rate_limits (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        last_attempt_at TIMESTAMPTZ NOT NULL,
        current_delay_seconds INTEGER DEFAULT 5,
        violation_count INTEGER DEFAULT 0,
        last_success_at TIMESTAMPTZ,
        UNIQUE(member_id)
      )`,

      // Table 5: member_suspensions
      `CREATE TABLE IF NOT EXISTS member_suspensions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        reason_details TEXT,
        suspended_by TEXT NOT NULL REFERENCES members(id),
        suspended_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT true
      )`,

      // Indexes for performance
      `CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation
        ON conversation_participants(conversation_id)`,

      `CREATE INDEX IF NOT EXISTS idx_conversation_participants_member
        ON conversation_participants(member_id)`,

      `CREATE INDEX IF NOT EXISTS idx_messages_conversation
        ON messages(conversation_id, created_at DESC)`,

      `CREATE INDEX IF NOT EXISTS idx_messages_expires
        ON messages(expires_at) WHERE NOT is_deleted`,

      `CREATE INDEX IF NOT EXISTS idx_suspensions_member_active
        ON member_suspensions(member_id, is_active, expires_at)`,
    ];

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const tableName = stmt.match(/TABLE.*?(\w+)/)?.[1] || `statement ${i + 1}`;

      try {
        // Use rpc to execute raw SQL
        const { error } = await (supabaseAdmin as any).rpc('exec_sql', {
          query: stmt,
        });

        if (error) {
          // Try alternative: direct query (for Supabase that doesn't have exec_sql)
          const { error: directError } = await (supabaseAdmin as any)
            .from('_migrations')
            .select('*')
            .limit(0);

          // If both methods fail, we need to use Supabase dashboard
          console.log(`⚠️  ${tableName}: Need manual execution`);
          errorCount++;
        } else {
          console.log(`✅ ${tableName}`);
          successCount++;
        }
      } catch (err) {
        console.log(`⚠️  ${tableName}: ${err}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n❌ Migration could not be applied automatically.');
      console.log('📝 Manual steps required:');
      console.log('   1. Open Supabase Dashboard: https://supabase.com/dashboard');
      console.log('   2. Navigate to: Project > SQL Editor');
      console.log('   3. Create new query and paste content from:');
      console.log('      supabase/migrations/012_create_messaging_system.sql');
      console.log('   4. Click "Run" to execute');
      console.log('   5. Then run: npx tsx scripts/check-messaging-tables.ts');
    } else {
      console.log('\n✅ Migration completed successfully!');
    }

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
  }
}

applyMigration().catch(console.error);
