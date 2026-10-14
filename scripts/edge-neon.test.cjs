const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(
  fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }
).outputText, filename);

process.env.DATABASE_URL = 'postgresql://test:password@ep-edge-test-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
process.env.JWT_SECRET = 'security-test-secret-0123456789abcdef0123456789';
process.env.SECURITY_RATE_LIMIT_STORE = 'memory';
const { queryNeonJson } = require('../lib/db-edge.ts');
const { middleware } = require('../middleware.ts');
const { NextRequest } = require('next/server');
const { SignJWT } = require('jose');

async function memberRequest() {
  const token = await new SignJWT({ memberId: 'member-one', email: 'member@example.com', role: 'member' })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));
  return new NextRequest('https://example.com/member/profile', { headers: { cookie: `member_token=${token}` } });
}

test('Edge middleware has no Node PostgreSQL dependency', () => {
  const seen = new Set();
  function walk(filename) {
    if (seen.has(filename)) return;
    seen.add(filename);
    const source = fs.readFileSync(filename, 'utf8');
    for (const match of source.matchAll(/(?:from\s+|import\s*\()['"]([^'"]+)['"]/g)) {
      const imported = match[1];
      assert.notEqual(imported, 'pg');
      assert.notEqual(imported, 'jsonwebtoken');
      if (imported.startsWith('.') || imported.startsWith('@/')) {
        const base = imported.startsWith('@/') ? path.join(root, imported.slice(2)) : path.resolve(path.dirname(filename), imported);
        assert.notEqual(base, path.join(root, 'lib/db'));
        if (fs.existsSync(base + '.ts')) walk(base + '.ts');
      }
    }
  }
  walk(path.join(root, 'middleware.ts'));
});

test('Neon Edge requests preserve parameters, decode JSON and never cache the result', async () => {
  const savedFetch = global.fetch;
  let sent;
  try {
    global.fetch = async (url, options) => {
      sent = { url, ...options, body: JSON.parse(options.body) };
      return Response.json({ rows: [{ result: '{"value":true}' }] });
    };
    const rows = await queryNeonJson('SELECT $1::jsonb AS result', ['{"value":true}']);
    assert.deepEqual(rows, [{ value: true }]);
    assert.equal(sent.url, 'https://ep-edge-test.ap-southeast-1.aws.neon.tech/sql');
    assert.deepEqual(sent.body.params, ['{"value":true}']);
    assert.equal(sent.headers['Neon-Connection-String'], process.env.DATABASE_URL);
    assert.equal(sent.cache, 'no-store');
  } finally { global.fetch = savedFetch; }
});

test('active suspension redirects; database outage blocks access with 503', async () => {
  const savedFetch = global.fetch;
  try {
    global.fetch = async (_url, options) => {
      assert.deepEqual(JSON.parse(options.body).params, ['member-one']);
      return Response.json({ rows: [{ result: JSON.stringify({ is_suspended: true,
        suspension_type: 'permanent', reason_category: 'terms_violation', suspended_at: '2026-10-14T00:00:00.000Z' }) }] });
    };
    const denied = await middleware(await memberRequest());
    assert.equal(denied.status, 307);
    assert.equal(new URL(denied.headers.get('location')).pathname, '/member/suspended');
    global.fetch = async () => new Response('', { status: 503 });
    assert.equal((await middleware(await memberRequest())).status, 503);
  } finally { global.fetch = savedFetch; }
});

test('unsuspended members pass; invalid database output fails closed', async () => {
  const savedFetch = global.fetch;
  try {
    global.fetch = async () => Response.json({ rows: [] });
    assert.equal((await middleware(await memberRequest())).status, 200);
    global.fetch = async () => Response.json({ unexpected: [] });
    assert.equal((await middleware(await memberRequest())).status, 503);
  } finally { global.fetch = savedFetch; }
});
