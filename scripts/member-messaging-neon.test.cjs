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
let session, calls, responseFor, releaseCount, limited;
require.cache[path.join(root, 'lib/auth/session.ts')] = { exports: {
  verifyRequestSession: async () => session, ADMIN_ROLES: ['admin', 'super-admin'],
} };
require.cache[path.join(root, 'lib/auth/jwt.ts')] = { exports: {
  verifyMemberToken: async () => session,
  checkMemberSuspension: async () => ({ suspended: false }),
} };
require.cache[path.join(root, 'lib/member-suspension.ts')] = { exports: { checkMemberSuspension: async () => ({ isSuspended: false }) } };
require.cache[path.join(root, 'lib/message-rate-limit.ts')] = { exports: {
  checkRateLimit: async () => ({ success: !limited, retryAfter: 5 }), detectSpam: () => false,
  validateMessageLength: text => ({ valid: text.length > 0 && text.length <= 2000 }),
} };
const pool = require('../lib/db.ts').default;
pool.connect = async () => ({
  query: async (statement, params = []) => {
    const sql = statement.trim().replace(/\s+/g, ' ');
    calls.push({ sql, params });
    const rows = responseFor(sql, params);
    return { rows, rowCount: rows.length };
  }, release: () => releaseCount++,
});
const { NextRequest } = require('next/server');
const send = require('../app/api/messages/send/route.ts');
const messages = require('../app/api/messages/[id]/route.ts');
const conversations = require('../app/api/messages/conversations/route.ts');
const paginated = require('../app/api/messages/conversations/[id]/route.ts');
const search = require('../app/api/messages/members/search/route.ts');
const req = (url, body) => new NextRequest('http://localhost:2024' + url, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
beforeEach(() => {
  session = { memberId: 'self', role: 'member', email: 'self@example.invalid' };
  calls = []; releaseCount = 0; limited = false;
  responseFor = sql => {
    if (sql.startsWith('SELECT * FROM conversation_participants')) return [{ id: 'participant' }];
    if (sql.startsWith('SELECT * FROM conversations')) return [{ id: 'conversation' }];
    if (sql.startsWith('SELECT role FROM members')) return [{ role: 'member' }];
    if (sql.startsWith('INSERT INTO messages')) return [{ id: 'message' }];
    return [];
  };
});
test('sending rejects absent identity and forged sender before any database work', async () => {
  session = null;
  assert.equal((await send.POST(req('/api/messages/send', { conversationId: 'one', content: 'Hello' }))).status, 401);
  session = { memberId: 'self' };
  assert.equal((await send.POST(req('/api/messages/send', { conversationId: 'one', senderId: 'other', content: 'Hello' }))).status, 403);
  assert.equal(calls.length, 0);
});
test('sender derives from session and participant query keeps both constraints', async () => {
  const result = await send.POST(req('/api/messages/send', { conversationId: 'one', content: 'Hello' }));
  assert.equal(result.status, 200);
  const membership = calls.find(call => call.sql.startsWith('SELECT * FROM conversation_participants'));
  assert.match(membership.sql, /WHERE conversation_id = \$1 AND member_id = \$2/);
  assert.deepEqual(membership.params, ['one', 'self']);
  const insert = calls.find(call => call.sql.startsWith('INSERT INTO messages'));
  assert.equal(insert.params[1], 'self');
  assert.equal(insert.params[3], false);
});
test('membership, cooldown, content types and link rules prevent invalid sends', async () => {
  assert.equal((await send.POST(req('/api/messages/send', { conversationId: 'one', content: {} }))).status, 400);
  responseFor = () => [];
  assert.equal((await send.POST(req('/api/messages/send', { conversationId: 'one', content: 'Hello' }))).status, 403);
  limited = true;
  assert.equal((await send.POST(req('/api/messages/send', { conversationId: 'one', content: 'Hello' }))).status, 429);
});
test('super-admin can send a link with link metadata persisted', async () => {
  responseFor = sql => {
    if (sql.startsWith('SELECT role FROM members')) return [{ role: 'super-admin' }];
    if (sql.startsWith('INSERT INTO messages')) return [{ id: 'message' }];
    return [{ id: 'one' }];
  };
  assert.equal((await send.POST(req('/api/messages/send', { conversationId: 'one', content: 'https://example.invalid' }))).status, 200);
  assert.equal(calls.find(call => call.sql.startsWith('INSERT INTO messages')).params[3], true);
});
test('message reads use SQL joins and keep read receipts scoped to the requester', async () => {
  responseFor = sql => {
    if (sql.startsWith('SELECT id FROM conversation_participants')) return [{ id: 'participant' }];
    if (sql.startsWith('SELECT message.id')) return [{ id: 'message', sender_id: 'other', sender: { id: 'other', full_name: 'Other' } }];
    return [];
  };
  const result = await messages.GET(req('/api/messages/one'), { params: { id: 'one' } });
  assert.equal(result.status, 200);
  assert.equal((await result.json()).messages[0].sender.fullName, 'Other');
  assert.match(calls.find(call => call.sql.startsWith('SELECT message.id')).sql, /expires_at > NOW\(\)/);
  const update = calls.find(call => call.sql.startsWith('UPDATE conversation_participants'));
  assert.deepEqual(update.params.slice(1), ['one', 'self']);
});
test('conversation list joins participants and calculates filtered unread counts', async () => {
  responseFor = sql => {
    if (sql.startsWith('SELECT conversation_id, last_read_at')) return [{ conversation_id: 'one', last_read_at: '2026-01-01T00:00:00Z' }];
    if (sql.startsWith('SELECT id, created_at, last_message_at')) return [{ id: 'one', created_at: '2026-01-01T00:00:00Z' }];
    if (sql.startsWith('SELECT participant.member_id')) return [{ members: { id: 'other', full_name: 'Other' } }];
    if (sql.startsWith('SELECT COUNT')) return [{ count: '2' }];
    return [];
  };
  const result = await conversations.GET(req('/api/messages/conversations'));
  assert.equal(result.status, 200);
  const body = await result.json();
  assert.equal(body.conversations[0].participants[0].fullName, 'Other');
  assert.equal(body.conversations[0].unreadCount, 2);
});
test('creating conversation is transactional and locks the member pair', async () => {
  responseFor = sql => {
    if (sql.startsWith('SELECT id, status FROM members')) return [{ id: 'other', status: 'active' }];
    if (sql.startsWith('INSERT INTO conversations')) return [{ id: 'created' }];
    return [];
  };
  const result = await conversations.POST(req('/api/messages/conversations', { recipientMemberId: 'other' }));
  assert.equal(result.status, 200);
  assert.equal((await result.json()).conversationId, 'created');
  assert.equal(calls[0].sql, 'BEGIN');
  assert.match(calls[1].sql, /pg_advisory_xact_lock/);
  assert.match(calls.find(call => call.sql.includes('COUNT(*) FILTER')).sql, /HAVING COUNT\(\*\) = 2/);
  assert.equal(calls.at(-1).sql, 'COMMIT');
  assert.equal(releaseCount, 1);
});
test('conversation participant insertion failure rolls back', async () => {
  responseFor = sql => {
    if (sql.startsWith('SELECT id, status FROM members')) return [{ id: 'other', status: 'active' }];
    if (sql.startsWith('INSERT INTO conversations')) return [{ id: 'created' }];
    if (sql.startsWith('INSERT INTO conversation_participants')) throw new Error('test insert failed');
    return [];
  };
  assert.equal((await conversations.POST(req('/api/messages/conversations', { recipientMemberId: 'other' }))).status, 500);
  assert.equal(calls.at(-1).sql, 'ROLLBACK');
  assert.equal(releaseCount, 1);
});
test('member search binds punctuation safely and filters suspensions before LIMIT', async () => {
  assert.equal((await search.GET(req('/api/messages/members/search?q=Name%2C%20email'))).status, 200);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].params, ['self', '%Name, email%']);
  assert.match(calls[0].sql, /NOT EXISTS.*expires_at > NOW\(\).*LIMIT 20/);
});
test('paginated message route validates cursor and caps limit', async () => {
  assert.equal((await paginated.GET(req('/api/messages/conversations/one?cursor=invalid'), { params: { id: 'one' } })).status, 400);
  responseFor = sql => sql.startsWith('SELECT id FROM conversation_participants') ? [{ id: 'one' }] : [];
  assert.equal((await paginated.GET(req('/api/messages/conversations/one?limit=9999'), { params: { id: 'one' } })).status, 200);
  assert.equal(calls.find(call => call.sql.includes('FROM messages m')).params.at(-1), 101);
  assert.ok(calls.every(call => !call.sql.includes('mem.first_name')));
});
