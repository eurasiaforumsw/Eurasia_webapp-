const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
let session, suspended, databaseError, calls;
require.cache[path.join(root, 'lib/auth/jwt.ts')] = { exports: {
  verifyMemberToken: async () => session,
  checkMemberSuspension: async () => ({ suspended }),
} };
require.cache[path.join(root, 'lib/db.ts')] = { exports: { db: {}, query: async (sql, values) => {
  calls.push({ sql, values });
  if (databaseError) throw new Error('Simulated database outage');
  return { rows: [{ count: '3' }] };
} } };
const { NextRequest } = require('next/server');
const { GET } = require('../app/api/messages/unread-count/route.ts');
beforeEach(() => { session = { memberId: 'self' }; suspended = false; databaseError = false; calls = []; });
const request = () => new NextRequest('http://localhost:2024/api/messages/unread-count');

test('unread count requires a member session and rejects suspended members before reads', async () => {
  session = null;
  assert.equal((await GET(request())).status, 401);
  session = { memberId: 'self' }; suspended = true;
  assert.equal((await GET(request())).status, 403);
  assert.equal(calls.length, 0);
});
test('unread count scopes participants and excludes own, deleted, expired and read messages', async () => {
  const response = await GET(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { unreadCount: 3 });
  assert.deepEqual(calls[0].values, ['self']);
  const sql = calls[0].sql.replace(/\s+/g, ' ');
  assert.match(sql, /participant.member_id = \$1 AND message.sender_id != \$1/);
  assert.match(sql, /message.deleted_at IS NULL AND message.expires_at > NOW\(\)/);
  assert.match(sql, /participant.last_read_at IS NULL OR message.created_at > participant.last_read_at/);
});
test('unread count reports an outage without claiming zero unread messages', async () => {
  databaseError = true;
  const original = console.error;
  console.error = () => {};
  try { assert.equal((await GET(request())).status, 500); }
  finally { console.error = original; }
});
