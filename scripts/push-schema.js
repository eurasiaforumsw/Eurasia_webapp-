#!/usr/bin/env node
/**
 * Push all SQL migrations to Neon database.
 * Reads migration files in order and executes each file atomically with its
 * tracking row. Historical migrations may contain a top-level BEGIN/COMMIT;
 * those wrappers are removed because PostgreSQL does not support nesting them.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function hasOwnTransaction(sql) {
  const withoutLeadingComments = sql
    .replace(/^(?:\s*(?:--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/))*\s*/u, '')
    .trimStart();
  return /^BEGIN\s*;/i.test(withoutLeadingComments);
}

function normalizeMigrationSql(sql) {
  if (!hasOwnTransaction(sql)) return sql;
  const opening = /^((?:\s*(?:--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/))*\s*)BEGIN\s*;/iu;
  const closing = /\s*COMMIT\s*;((?:\s*(?:--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/))*\s*)$/iu;
  if (!closing.test(sql)) throw new Error('A migration BEGIN must have a trailing COMMIT');
  return sql.replace(opening, '$1').replace(closing, '$1');
}

function migrationFiles(migrationsDir) {
  return fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();
}

async function applyMigrations(client, fileSources) {
  const executedResult = await client.query('SELECT name FROM _migrations');
  const executedSet = new Set(executedResult.rows.map((row) => row.name));
  let applied = 0;
  let skipped = 0;

  for (const { file, sql } of fileSources) {
    if (executedSet.has(file)) {
      skipped++;
      continue;
    }

    await client.query('BEGIN');
    try {
      await client.query(normalizeMigrationSql(sql));
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      executedSet.add(file);
      applied++;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw Object.assign(error, { migration: file });
    }
  }

  return { applied, skipped, total: fileSources.length };
}

async function pushSchema({ databaseUrl, migrationsDir = path.join(__dirname, '../supabase/migrations'), PoolClass = Pool } = {}) {
  if (!databaseUrl) {
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
    databaseUrl = process.env.DATABASE_URL;
  }
  if (!databaseUrl) throw new Error('DATABASE_URL is required to push schema');
  const pool = new PoolClass({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  let client;
  let migrationLockHeld = false;
  try {
    const files = migrationFiles(migrationsDir);
    console.log('📦 Reading migration files from:', migrationsDir);
    console.log(`Found ${files.length} migration files\n`);
    client = await pool.connect();
    // Serialize deploy jobs sharing a Neon database. The session lock is held
    // until all migration tracking is committed and released on disconnect.
    await client.query("SELECT pg_advisory_lock(hashtext('efsw_schema_migrations'))");
    migrationLockHeld = true;
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const sources = files.map((file) => ({
      file,
      sql: fs.readFileSync(path.join(migrationsDir, file), 'utf8'),
    }));
    const summary = await applyMigrations(client, sources);
    console.log('\n✨ Schema push complete!');
    console.log(`   Applied: ${summary.applied}`);
    console.log(`   Skipped: ${summary.skipped}`);
    console.log(`   Total: ${summary.total}`);
    return summary;
  } finally {
    if (client && migrationLockHeld) {
      await client.query("SELECT pg_advisory_unlock(hashtext('efsw_schema_migrations'))").catch(() => {});
    }
    if (client) client.release();
    await pool.end();
  }
}

if (require.main === module) {
  pushSchema().catch((error) => {
    const suffix = error.migration ? ` (${error.migration})` : '';
    console.error(`\n💥 Push failed${suffix}:`, error.message);
    process.exitCode = 1;
  });
}

module.exports = { applyMigrations, hasOwnTransaction, migrationFiles, normalizeMigrationSql, pushSchema };
