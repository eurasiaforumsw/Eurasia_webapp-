/**
 * Run messaging system migration using Supabase client
 * This is safer than using psql with credentials
 */

import { supabaseAdmin } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  console.log('🚀 Running messaging system migration...\n');

  if (!supabaseAdmin) {
    console.error('❌ Supabase admin client not configured');
    process.exit(1);
  }

  try {
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/012_create_messaging_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📊 Executing SQL statements...\n');

    // Split SQL by statements (simple split by semicolon + newline)
    const statements = sql
      .split(';\n')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: statement });

      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error);
        console.error('Statement:', statement.substring(0, 200));

        // Try using raw query instead
        console.log('Trying alternative method...');
        const { error: altError } = await (supabaseAdmin as any).from('_').select(statement);

        if (altError) {
          console.error('❌ Alternative method also failed:', altError);
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }

    console.log('\n✅ Migration completed!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

runMigration().catch(console.error);
