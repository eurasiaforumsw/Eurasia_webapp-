#!/usr/bin/env node
/**
 * Reset and reapply auth compatibility migration
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

async function reset() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Resetting auth compatibility...');

    // Drop auth schema if exists
    await pool.query('DROP SCHEMA IF EXISTS auth CASCADE');
    console.log('✓ Dropped auth schema');

    // Drop roles if exist
    await pool.query('DROP ROLE IF EXISTS service_role');
    await pool.query('DROP ROLE IF EXISTS anon');
    await pool.query('DROP ROLE IF EXISTS authenticated');
    console.log('✓ Dropped roles');

    // Remove from migrations table
    await pool.query('DELETE FROM _migrations WHERE name = $1', ['000_auth_compatibility.sql']);
    console.log('✓ Removed from migrations tracking');

    console.log('\n✅ Reset complete. Run: node scripts/push-schema.js');

  } catch (err) {
    console.error('❌ Reset failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

reset();
