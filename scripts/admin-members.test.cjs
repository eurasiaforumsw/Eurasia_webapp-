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
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
let session = { id: 'reviewer', role: 'member-reviewer' };
const rows = new Map([['one', { id: 'one', role: 'member', status: 'pending', full_name: 'One', email: 'one@example.invalid' }], ['two', { id: 'two', role: 'member', status: 'pending' }], ['admin', { id: 'admin', role: 'admin' }]]);
const rpcCalls = [];
const database = {
  from() {
    let ids = [...rows.keys()];
    let deleting = false;
    const result = () => {
      const data = ids.filter((id) => rows.has(id)).map((id) => ({ ...rows.get(id) }));
      if (deleting) ids.forEach((id) => rows.delete(id));
      return { data, error: null };
    };
    const q = {
      select() { return q; }, in(_key, values) { ids = values; return q; }, eq(_key, id) { ids = [id]; return q; },
      delete() { deleting = true; return q; }, order() { return q; },
      maybeSingle() { return Promise.resolve({ ...result(), data: result().data[0] || null }); },
      then(ok, fail) { return Promise.resolve(result()).then(ok, fail); },
    }; return q;
  },
  async rpc(name, args) {
    rpcCalls.push({ name, args });
    if (args.p_member_id === 'two') return { error: { message: 'Database write failed' } };
    const row = rows.get(args.p_member_id);
    row.status = args.p_status;
    row.review_note = args.p_review_note;
    return { error: null };
  },
};
require.cache[path.join(root, 'lib/supabase.ts')] = { exports: { supabaseAdmin: database } };
require.cache[path.join(root, 'lib/api-auth.ts')] = { exports: {
  requireRole: async (_request, roles) => { if (!session) throw new Error('Unauthorized'); if (!roles.includes(session.role)) throw new Error('Forbidden'); return session; },
  verifyRequestToken: async () => session,
} };
require.cache[path.join(root, 'lib/auth/session.ts')] = { exports: { ADMIN_ROLES: ['admin', 'super-admin'], MEMBER_REVIEW_ROLES: ['admin', 'super-admin', 'member-reviewer'] } };
const { NextRequest } = require('next/server');
const bulk = require('../app/api/members/bulk/route.ts');
const members = require('../app/api/members/route.ts');
const client = require('../lib/admin-members.ts');
function request(body) { return new NextRequest('http://localhost/api/members', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }); }

test('bulk review uses server auth and reports missing and failed records honestly', async () => {
  const response = await bulk.POST(request({ action: 'approve', ids: ['one', 'two', 'absent', 'admin'] }));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.success, false);
  assert.deepEqual(result.summary, { total: 4, succeeded: 1, failed: 3 });
  assert.equal(rows.get('one').status, 'active');
  assert.equal(rows.get('two').status, 'pending');
  assert.equal(result.results.find((r) => r.id === 'admin').success, false);
  assert.equal(rpcCalls[0].name, 'admin_review_member');
});
test('reviewer cannot delete members and unauthenticated bulk caller is rejected', async () => {
  assert.equal((await bulk.POST(request({ action: 'delete', ids: ['one'] }))).status, 403);
  session = null;
  assert.equal((await bulk.POST(request({ action: 'approve', ids: ['one'] }))).status, 401);
  session = { id: 'reviewer', role: 'member-reviewer' };
});
test('single review persists note using the same authoritative transaction', async () => {
  const response = await members.PATCH(request({ id: 'one', status: 'suspended', reviewNote: 'Confirmed abuse' }));
  assert.equal(response.status, 200);
  const { member } = await response.json();
  assert.equal(member.status, 'suspended');
  assert.equal(member.reviewNote, 'Confirmed abuse');
  assert.deepEqual(rpcCalls.at(-1).args, { p_member_id: 'one', p_status: 'suspended', p_actor_id: 'reviewer', p_review_note: 'Confirmed abuse' });
});
test('member cannot change status or administrator notes', async () => {
  session = { id: 'one', memberId: 'one', role: 'member' };
  assert.equal((await members.PATCH(request({ id: 'one', reviewNote: 'Forged note' }))).status, 403);
  session = { id: 'reviewer', role: 'member-reviewer' };
});
test('client uses POST and preserves individual failure results', async () => {
  global.fetch = async (_url, options) => {
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { action: 'approve', ids: ['one', 'two'] });
    return Response.json({ results: [{ id: 'one', success: true }, { id: 'two', success: false, error: 'Failed' }] });
  };
  assert.deepEqual(await client.executeMemberBulk('approve', ['one', 'two']), [{ id: 'one', success: true }, { id: 'two', success: false, error: 'Failed' }]);
  global.fetch = async () => Response.json({ error: 'Database unavailable' }, { status: 503 });
  await assert.rejects(client.updateAdminMemberStatus('one', 'active'), /Database unavailable/);
  await assert.rejects(client.deleteAdminMemberRemote('one'), /Database unavailable/);
});
test('logout expires both supported session cookies', async () => {
  const response = await require('../app/api/admin/auth/logout/route.ts').POST(request({}));
  const cookies = response.headers.get('set-cookie');
  assert.match(cookies, /admin_token=;/);
  assert.match(cookies, /member_token=;/);
  assert.match(cookies, /Max-Age=0/i);
});
