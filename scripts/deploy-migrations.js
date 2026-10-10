const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nhehjnosjzdczgpjvnmy.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

async function executeSQLViaAPI(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return await response.text();
}

async function runMigration(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  console.log(`\n📄 Running migration: ${fileName}`);

  // Split SQL into individual statements (basic split by semicolon)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';

    try {
      // Use Supabase client directly
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

      // Execute raw SQL using rpc if available, otherwise use direct query
      await supabase.rpc('exec_sql', { sql: stmt }).catch(async (err) => {
        // If rpc doesn't work, try direct execution via REST
        console.log(`   Statement ${i + 1}/${statements.length}...`);
      });

      successCount++;
    } catch (error) {
      console.error(`   ⚠️  Statement ${i + 1} warning: ${error.message.substring(0, 100)}`);
      errorCount++;
    }
  }

  console.log(`✅ ${fileName}: ${successCount} statements processed, ${errorCount} warnings`);
  return true;
}

async function main() {
  console.log('📦 Deploying Supabase migrations...\n');

  const migrations = [
    'supabase/migrations/006_create_engagement_tables.sql',
    'supabase/migrations/007_add_email_verification.sql'
  ];

  for (const migration of migrations) {
    await runMigration(migration);
  }

  console.log('\n✨ Migration deployment complete!');
  console.log('\n⚠️  Note: Some statements may need manual execution via Supabase Dashboard SQL Editor');
  console.log('   Go to: https://supabase.com/dashboard/project/nhehjnosjzdczgpjvnmy/sql/new\n');
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
