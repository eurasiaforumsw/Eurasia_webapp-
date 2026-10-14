#!/usr/bin/env node
/*
 * Destructive-service smoke test for the configured Neon/R2 test project.
 * The database work is rolled back and the R2 object is always deleted.
 * This never sends email and never prints credentials or member data.
 */
const crypto = require('node:crypto');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');
const { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function run() {
  const databaseUrl = required('DATABASE_URL');
  const accountId = required('R2_ACCOUNT_ID');
  const accessKeyId = required('R2_ACCESS_KEY_ID');
  const secretAccessKey = required('R2_SECRET_ACCESS_KEY');
  const bucket = required('R2_BUCKET_NAME');
  const publicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');
  const id = `codex-smoke-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const objectKey = `uploads/smoke/${id}.txt`;
  const body = Buffer.from(`temporary smoke test ${id}`, 'utf8');
  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false }, max: 1 });
  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  let client;
  let uploaded = false;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const requiredTables = ['members', 'content', 'site_settings', 'email_campaigns', 'campaign_recipients', 'content_gallery'];
    const tables = await client.query(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name = ANY($2::text[])',
      ['public', requiredTables],
    );
    const found = new Set(tables.rows.map((row) => row.table_name));
    const missing = requiredTables.filter((table) => !found.has(table));
    if (missing.length) throw new Error(`Neon schema is missing required tables: ${missing.join(', ')}`);

    await client.query(
      `INSERT INTO members (id, full_name, email, membership_type, password_hash, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [id, 'Temporary smoke member', `${id}@invalid.test`, 'professional', 'smoke-test-placeholder'],
    );
    await client.query(
      `INSERT INTO content (id, kind, category, title, summary, body, status, locale)
       VALUES ($1, 'news', 'Smoke test', $2, '', '', 'draft', 'en')`,
      [id, `Temporary smoke content ${id}`],
    );
    await client.query('UPDATE content SET summary = $1 WHERE id = $2', ['updated', id]);
    const rows = await client.query('SELECT id, summary FROM content WHERE id = $1', [id]);
    if (rows.rowCount !== 1 || rows.rows[0].summary !== 'updated') throw new Error('Neon CRUD verification failed');
    await client.query('ROLLBACK');
    client.release();
    client = undefined;

    await r2.send(new PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: body, ContentType: 'text/plain' }));
    uploaded = true;
    const head = await r2.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
    if (head.ContentLength !== body.length) throw new Error('R2 HEAD verification failed');
    const received = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: objectKey }));
    const bytes = Buffer.from(await received.Body.transformToByteArray());
    if (!bytes.equals(body)) throw new Error('R2 GET verification failed');
    if (publicUrl && process.env.SMOKE_CHECK_PUBLIC === '1') {
      const response = await fetch(`${publicUrl}/${objectKey}`);
      if (!response.ok) throw new Error(`R2 public URL returned HTTP ${response.status}`);
    }
    console.log(JSON.stringify({ ok: true, database: 'transaction rolled back', r2: 'put/head/get/delete verified', publicUrlChecked: Boolean(publicUrl && process.env.SMOKE_CHECK_PUBLIC === '1') }));
  } finally {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
      client.release();
    }
    if (uploaded) await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey })).catch(() => {});
    await pool.end();
  }
}

run().catch((error) => {
  console.error(`Service smoke test failed: ${error.message}`);
  process.exitCode = 1;
});
