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
process.env.JWT_SECRET = 'suspension-test-0123456789abcdef0123456789';
const calls = [];
let rpcError = null;
const database = {
  async rpc(name, args) { calls.push({ name, args }); return { data: name === 'admin_lift_suspension' ? true : 'susp_text-id', error: rpcError }; },
  from() {
    const query = { select() { return query; }, eq() { return query; }, order() { return query; },
      maybeSingle() { return Promise.resolve({ data: { id: 'susp_text-id' }, error: null }); },
      single() { return query.maybeSingle(); },
      then(yes, no) { return Promise.resolve({ data: [], error: null }).then(yes, no); },
    };
    return query;
  },
};
require.cache[path.join(root, 'lib/supabase.ts')] = { exports: { supabaseAdmin: database } };
const { NextRequest } = require('next/server');
const { SignJWT } = require('jose');
const admin = require('../app/api/admin/suspensions/route.ts');
const member = require('../app/api/admin/members/[id]/suspend/route.ts');
const messages = require('../app/api/messages/suspend/route.ts');
const details = require('../app/api/admin/members/[id]/details/route.ts');
const history = require('../app/api/admin/members/[id]/suspensions/route.ts');
async function token(role = 'admin', legacy = false) {
  return new SignJWT({ email: legacy ? 'admin@efsw.local' : 'review@example.com', role,
    ...(legacy ? {} : { memberId: 'reviewer-one' }) })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));
}
function req(method, body, jwt, query = '') {
  return new NextRequest(`http://localhost:2024/api/admin/suspensions${query}`, {
    method, headers: { ...(jwt ? { authorization: `Bearer ${jwt}` } : {}), 'content-type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
const body = { memberId: 'member-one', suspensionType: 'temporary_custom', reasonCategory: 'spam_flooding', customDays: 7 };

test('suspension writes use the verified session actor and normalized text-compatible RPC', async () => {
  calls.length = 0;
  const response = await admin.POST(req('POST', { ...body, suspendedBy: 'spoofed-member' }, await token('member-reviewer')));
  assert.equal(response.status, 200);
  assert.equal(calls[0].name, 'admin_suspend_member');
  assert.equal(calls[0].args.p_actor_id, 'reviewer-one');
  assert.equal(calls[0].args.p_custom_days, 7);
  const legacy = await admin.POST(req('POST', body, await token('super-admin', true)));
  assert.equal(legacy.status, 200);
  assert.equal(calls[1].args.p_actor_id, 'admin@efsw.local');
});

test('all suspension endpoints reject forged sessions and ordinary members', async () => {
  const params = { params: { id: 'member-one' } };
  for (const [jwt, status] of [[undefined, 401], ['forged', 401], [await token('member'), 403]]) {
    calls.length = 0;
    assert.equal((await admin.GET(req('GET', undefined, jwt, '?active=true'))).status, status);
    assert.equal((await admin.POST(req('POST', body, jwt))).status, status);
    assert.equal((await admin.DELETE(req('DELETE', undefined, jwt, '?suspensionId=susp_text-id'))).status, status);
    assert.equal((await messages.POST(req('POST', body, jwt))).status, status);
    assert.equal((await member.POST(req('POST', {}, jwt), params)).status, status);
    assert.equal((await details.GET(req('GET', undefined, jwt), params)).status, status);
    assert.equal((await history.GET(req('GET', undefined, jwt), params)).status, status);
    assert.equal(calls.length, 0);
  }
});

test('lifting a legacy text suspension derives the actor from the session', async () => {
  calls.length = 0;
  const response = await admin.DELETE(req('DELETE', undefined, await token('member-reviewer'), '?suspensionId=susp_text-id&liftedBy=spoofed'));
  assert.equal(response.status, 200);
  assert.deepEqual(calls[0], { name: 'admin_lift_suspension', args: { p_suspension_id: 'susp_text-id', p_actor_id: 'reviewer-one' } });
});

test('message suspension accepts current UI fields and maps legacy fields', async () => {
  calls.length = 0;
  const jwt = await token('super-admin', true);
  const current = await messages.POST(req('POST', { ...body, reasonDetails: 'Current UI notes' }, jwt));
  assert.equal(current.status, 200);
  assert.equal(calls[0].args.p_reason_details, 'Current UI notes');
  const legacy = await messages.POST(req('POST', { ...body, suspensionType: 'temp_24h', reasonCategory: 'tos_violation', reasonDetail: 'Legacy notes' }, jwt));
  assert.equal(legacy.status, 200);
  assert.equal(calls[1].args.p_suspension_type, 'temporary_24h');
  assert.equal(calls[1].args.p_reason_category, 'terms_violation');
  assert.equal(calls[1].args.p_reason_details, 'Legacy notes');
});

test('member reviewers can use member suspension routes and invalid durations never call the database', async () => {
  const jwt = await token('member-reviewer');
  const params = { params: { id: 'member-one' } };
  const response = await member.POST(req('POST', { suspension_type: 'temporary_24h', suspension_reason: 'Harassment' }, jwt), params);
  assert.equal(response.status, 200);
  const before = calls.length;
  for (const customDays of [0, -1, 1.5, 3651, '7']) {
    assert.equal((await admin.POST(req('POST', { ...body, customDays }, jwt))).status, 400);
  }
  assert.equal(calls.length, before);
});

test('database rejection does not report suspension success', async () => {
  rpcError = { message: 'Cannot suspend your own account or an administrator' };
  try {
    assert.equal((await admin.POST(req('POST', body, await token()))).status, 403);
  } finally { rpcError = null; }
});
