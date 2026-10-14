#!/usr/bin/env node
/**
 * Test database connection to Neon
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

async function testConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Testing Neon connection...');
    const result = await pool.query('SELECT NOW() as now, version() as version, current_database() as db');
    const row = result.rows[0];

    console.log('✅ Connection successful!');
    console.log('   Time:', row.now);
    console.log('   Database:', row.db);
    console.log('   Version:', row.version.split(' ').slice(0, 2).join(' '));

    // Check if any tables exist
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`\n📊 Found ${tables.rows.length} tables in public schema`);
    if (tables.rows.length > 0) {
      console.log('   Tables:', tables.rows.slice(0, 5).map(r => r.table_name).join(', ') + (tables.rows.length > 5 ? '...' : ''));
    } else {
      console.log('   ⚠️  No tables found - run: node scripts/push-schema.js');
    }

  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('\nCheck your DATABASE_URL in .env file');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();
