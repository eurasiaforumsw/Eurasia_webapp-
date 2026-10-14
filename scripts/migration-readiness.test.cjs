const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { applyMigrations, hasOwnTransaction, migrationFiles, normalizeMigrationSql, pushSchema } = require('./push-schema.js');

const migrations = path.join(__dirname, '..', 'supabase', 'migrations');

test('migration runner detects explicit transactions after leading comments', () => {
  assert.equal(hasOwnTransaction('-- header\nBEGIN;\nCOMMIT;'), true);
  assert.equal(hasOwnTransaction('/* header */\nBEGIN;\nCOMMIT;'), true);
  assert.equal(hasOwnTransaction('CREATE TABLE example (id text);'), false);
});

test('migration normalization removes only a file-level transaction wrapper', () => {
  const source = '-- header\nBEGIN;\nCREATE TABLE example (id text);\nCOMMIT;\n-- footer\n';
  const normalized = normalizeMigrationSql(source);
  assert.match(normalized, /^-- header\n/);
  assert.match(normalized, /CREATE TABLE example \(id text\);/);
  assert.match(normalized, /-- footer\n$/);
  assert.doesNotMatch(normalized, /\b(?:BEGIN|COMMIT)\s*;/i);
  assert.throws(() => normalizeMigrationSql('BEGIN;\nCREATE TABLE incomplete (id text);'), /trailing COMMIT/);
  const procedural = 'DO $$ BEGIN\n  PERFORM 1;\nEND $$;';
  assert.equal(normalizeMigrationSql(procedural), procedural);
});

test('migration runner atomically tracks applied files and rolls back failures', async () => {
  const calls = [];
  let failOn = '002_fail.sql';
  const client = {
    async query(text, values = []) {
      calls.push({ text: String(text).replace(/\s+/g, ' ').trim(), values });
      if (text === 'SELECT name FROM _migrations') return { rows: [{ name: '000_done.sql' }] };
      if (String(text).includes('002 failure')) throw new Error('migration SQL failed');
      if (String(text).startsWith('INSERT INTO _migrations') && values[0] === failOn) throw new Error('tracking failed');
      return { rows: [] };
    },
  };
  const summary = await assert.rejects(
    applyMigrations(client, [
      { file: '000_done.sql', sql: 'CREATE TABLE done (id text);' },
      { file: '001_ok.sql', sql: 'BEGIN; CREATE TABLE ok (id text); COMMIT;' },
      { file: failOn, sql: 'CREATE TABLE fail (id text); -- 002 failure' },
      { file: '003_never.sql', sql: 'CREATE TABLE never (id text);' },
    ]),
    (error) => error.migration === failOn && /migration SQL failed/.test(error.message),
  );
  assert.equal(summary, undefined);
  assert.deepEqual(calls.map(({ text }) => text), [
    'SELECT name FROM _migrations',
    'BEGIN',
    'CREATE TABLE ok (id text);',
    'INSERT INTO _migrations (name) VALUES ($1)',
    'COMMIT',
    'BEGIN',
    'CREATE TABLE fail (id text); -- 002 failure',
    'ROLLBACK',
  ]);
  assert.equal(calls.some(({ values }) => values.includes('003_never.sql')), false);
  failOn = null;
  calls.length = 0;
  const retried = await applyMigrations(client, [
    { file: '000_done.sql', sql: 'CREATE TABLE done (id text);' },
    { file: '001_ok.sql', sql: 'BEGIN; CREATE TABLE ok (id text); COMMIT;' },
  ]);
  assert.deepEqual(retried, { applied: 1, skipped: 1, total: 2 });
});

test('migration file discovery excludes backup and non-SQL files', () => {
  const files = migrationFiles(migrations);
  assert.ok(files.length > 0);
  assert.ok(files.every((file) => file.endsWith('.sql')));
  assert.equal(files.some((file) => file.endsWith('.bak')), false);
});

test('pushSchema serializes deploys and always releases the Neon client and pool', async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'efsw-migrations-'));
  fs.writeFileSync(path.join(temp, '001_test.sql'), 'BEGIN;\nCREATE TABLE example (id text);\nCOMMIT;\n');
  const calls = [];
  let released = false;
  let ended = false;
  const client = {
    async query(text, values = []) {
      const normalized = String(text).replace(/\s+/g, ' ').trim();
      calls.push(normalized);
      if (normalized === 'SELECT name FROM _migrations') return { rows: [] };
      return { rows: [] };
    },
    release() { released = true; },
  };
  class FakePool {
    constructor(options) { assert.equal(options.connectionString, 'postgres://migration-test'); }
    async connect() { return client; }
    async end() { ended = true; }
  }
  try {
    assert.deepEqual(await pushSchema({ databaseUrl: 'postgres://migration-test', migrationsDir: temp, PoolClass: FakePool }), {
      applied: 1, skipped: 0, total: 1,
    });
    assert.equal(calls[0], "SELECT pg_advisory_lock(hashtext('efsw_schema_migrations'))");
    assert.equal(calls.at(-1), "SELECT pg_advisory_unlock(hashtext('efsw_schema_migrations'))");
    assert.equal(released, true);
    assert.equal(ended, true);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('legacy suspension migration drops old checks before renaming values', () => {
  const source = fs.readFileSync(path.join(migrations, '016_message_rate_limiting_and_suspensions.sql'), 'utf8');
  const drop = source.indexOf('DROP CONSTRAINT IF EXISTS member_suspensions_suspension_type_check');
  const rename = source.indexOf("WHEN suspension_type = 'temp_24h'");
  assert.ok(drop >= 0 && rename > drop);
  assert.match(source, /ADD COLUMN IF NOT EXISTS reason_details/);
  assert.doesNotMatch(source, /ALTER COLUMN suspended_by SET NOT NULL/);
  assert.match(source, /DROP TRIGGER IF EXISTS trigger_set_message_expiry/);
});

test('forward suspension RPC repair uses text IDs and preserves service-role access', () => {
  const source = fs.readFileSync(path.join(migrations, '030_repair_legacy_suspension_rpc_types.sql'), 'utf8');
  assert.match(source, /DROP FUNCTION IF EXISTS public\.suspend_member\(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER\)/);
  assert.match(source, /RETURNS TEXT LANGUAGE plpgsql/);
  assert.match(source, /RETURNING id::TEXT INTO v_suspension_id/);
  assert.match(source, /DROP FUNCTION IF EXISTS public\.lift_suspension\(UUID, TEXT\)/);
  assert.match(source, /WHERE id::TEXT = p_suspension_id/);
  assert.match(source, /GRANT EXECUTE ON FUNCTION public\.lift_suspension\(TEXT, TEXT\) TO service_role/);
  assert.match(source, /CREATE OR REPLACE FUNCTION public\.expire_suspensions\(\)/);
  assert.match(source, /SET status = 'active'/);
});
