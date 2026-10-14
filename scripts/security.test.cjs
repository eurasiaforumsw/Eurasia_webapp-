const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

// Run the project's TypeScript with the installed compiler, without another dependency.
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};
require.extensions['.ts'] = (module, filename) => {
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  module._compile(source, filename);
};

process.env.JWT_SECRET = 'security-test-secret-0123456789abcdef0123456789';
process.env.SECURITY_RATE_LIMIT_STORE = 'memory';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:2024';
process.env.DATABASE_URL = 'postgresql://test:password@ep-security-test-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const calls = [];
let queryResult = { data: null, error: null };
const query = new Proxy({}, {
  get(_target, name) {
    if (name === 'then') return (resolve) => resolve(queryResult);
    return (...args) => {
      calls.push([name, ...args]);
      if (name === 'insert' && !Array.isArray(args[0])) queryResult = { data: args[0], error: null };
      return query;
    };
  },
});
const database = {
  from: (...args) => { calls.push(['from', ...args]); return query; },
  rpc: async (...args) => { calls.push(['rpc', ...args]); return queryResult; },
};
// No test talks to the real database or sends mail.
require.cache[path.join(root, 'lib/supabase.ts')] = { exports: { supabaseAdmin: database, supabase: database } };
require.cache[path.join(root, 'lib/db.ts')] = { exports: { db: database } };
let storedUploads = [];
require.cache[path.join(root, 'lib/r2.ts')] = { exports: {
  uploadToR2: async (...args) => { storedUploads.push(args); return 'https://media.example.invalid/test.webp'; },
} };

const { NextRequest } = require('next/server');
const { SignJWT } = require('jose');
const { middleware } = require('../middleware.ts');
const sessions = require('../lib/auth/session.ts');
const policy = require('../lib/security/policy.ts');
const { MemoryRateLimiter, consumeRateLimit } = require('../lib/security/rate-limit.ts');
const { contentSecurityPolicy } = require('../lib/security/headers.ts');
const members = require('../app/api/members/route.ts');
const resets = require('../app/api/members/reset-password/route.ts');
const upload = require('../app/api/upload/route.ts');
const { matchesFileSignature } = require('../lib/security/uploads.ts');
const interests = require('../app/api/engagement/interest/route.ts');
const stats = require('../app/api/engagement/stats/route.ts');
const content = require('../app/api/content/route.ts');
const memberLogin = require('../app/api/members/login/route.ts');
const adminVerify = require('../app/api/admin/auth/verify/route.ts');

async function token(claims = {}, options = {}) {
  let jwt = new SignJWT({ memberId: 'member-one', email: 'one@example.com', role: 'member', ...claims })
    .setProtectedHeader({ alg: options.algorithm || 'HS256' }).setIssuedAt();
  if (!options.noExpiry) jwt = jwt.setExpirationTime(options.expiry || '1h');
  return jwt.sign(new TextEncoder().encode(process.env.JWT_SECRET));
}
function request(url, { method = 'GET', jwt, body, headers = {} } = {}) {
  return new NextRequest(`http://localhost:2024${url}`, {
    method,
    headers: { ...(jwt ? { cookie: `member_token=${jwt}` } : {}),
      ...(body ? { 'content-type': 'application/json', origin: 'http://localhost:2024' } : {}), ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

test('administrator member login remains authenticated when opening the admin console', async () => {
  const password = 'test-admin-login-password';
  queryResult = { data: {
    id: 'admin-member', email: 'admin@efsw.local', full_name: 'Administrator',
    role: 'admin', status: 'active', password_hash: await require('bcrypt').hash(password, 12),
  }, error: null };
  const login = await memberLogin.POST(request('/api/members/login', {
    method: 'POST', body: { email: 'admin@efsw.local', password },
  }));
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie');
  assert.ok(cookie.startsWith('member_token='));
  assert.match(cookie, /HttpOnly/i);
  const headers = { cookie: cookie.split(';')[0] };
  assert.equal((await middleware(request('/admin', { headers }))).status, 200);
  const verifyRequest = request('/api/admin/auth/verify', { headers });
  assert.equal((await middleware(verifyRequest)).status, 200);
  const verified = await adminVerify.GET(verifyRequest);
  assert.equal(verified.status, 200);
  const session = await verified.json();
  assert.equal(session.email, 'admin@efsw.local');
  assert.equal(session.role, 'admin');
  assert.equal(session.id, 'admin-member');
  assert.ok(session.name);
});
test('console session verification accepts console roles and legacy administrator cookies', async () => {
  for (const role of sessions.CONSOLE_ROLES) {
    const jwt = await token({ role, name: 'Console user' });
    const req = request('/api/admin/auth/verify', { jwt });
    assert.equal((await middleware(req)).status, 200, role);
    assert.equal((await adminVerify.GET(req)).status, 200, role);
  }
  const jwt = require('jsonwebtoken').sign({
    email: 'admin@efsw.local', role: 'super-admin', name: 'Administrator',
  }, process.env.JWT_SECRET, { expiresIn: '1h', algorithm: 'HS256' });
  const response = await adminVerify.GET(request('/api/admin/auth/verify', {
    headers: { cookie: `admin_token=${jwt}` },
  }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).id, 'admin@efsw.local');
});
test('console verification rejects absent, forged and ordinary member sessions', async () => {
  for (const req of [request('/api/admin/auth/verify'),
    request('/api/admin/auth/verify', { jwt: 'invalid' }),
    request('/api/admin/auth/verify', { jwt: await token({ role: 'admin' }),
      headers: { authorization: 'Bearer invalid' } })]) {
    assert.equal((await adminVerify.GET(req)).status, 401);
  }
  const member = request('/api/admin/auth/verify', { jwt: await token() });
  assert.equal((await middleware(member)).status, 403);
  assert.equal((await adminVerify.GET(member)).status, 403);
});

test('regular members cannot call administrator APIs using a signed Bearer token', async () => {
  const response = await middleware(request('/api/admin/analytics/overview', {
    headers: { authorization: `Bearer ${await token()}` },
  }));
  assert.equal(response.status, 403);
});
test('upload requires authentication', async () => {
  const response = await middleware(request('/api/upload', { method: 'POST' }));
  assert.equal(response.status, 401);
});
test('registration is public only for POST; member list needs authentication', async () => {
  const response = await middleware(request('/api/members'));
  assert.equal(response.status, 401);
  assert.equal(policy.apiRoles('/api/members', 'POST'), null);
});
test('member profile reads cannot access another member', async () => {
  calls.length = 0;
  const response = await members.GET(request('/api/members?id=member-two', { jwt: await token() }));
  assert.equal(response.status, 403);
  assert.equal(calls.length, 0);
});
test('member profile writes cannot change another member or their own status/email', async () => {
  for (const body of [{ id: 'member-two', fullName: 'Attack' },
    { id: 'member-one', status: 'active' }, { id: 'member-one', email: 'admin@example.com' }]) {
    calls.length = 0;
    const response = await members.PATCH(request('/api/members', { method: 'PATCH', jwt: await token(), body }));
    assert.equal(response.status, 403);
    assert.equal(calls.length, 0);
  }
});
test('registration cannot overwrite a supplied ID or choose its status/role', async () => {
  queryResult = { data: null, error: null };
  calls.length = 0;
  const log = console.info;
  console.info = () => {};
  try {
    const response = await members.POST(request('/api/members', { method: 'POST', body: {
      id: 'member-victim', fullName: 'Registrant', email: 'register@example.com',
      password: 'strong-password', status: 'active', role: 'admin', joinedAt: '1990-01-01',
    } }));
    assert.equal(response.status, 200);
    const insert = calls.find(([name]) => name === 'insert')[1];
    assert.notEqual(insert.id, 'member-victim');
    assert.equal(insert.role, 'member');
    assert.equal(insert.status, 'pending');
    assert.notEqual(insert.joined_at, '1990-01-01');
    assert.ok(!calls.some(([name]) => name === 'upsert'));
  } finally { console.info = log; }
});
test('a member can read and update their own profile', async () => {
  queryResult = { data: { id: 'member-one', email: 'one@example.com', full_name: 'One' }, error: null };
  const jwt = await token();
  assert.equal((await members.GET(request('/api/members?id=member-one', { jwt }))).status, 200);
  assert.equal((await members.PATCH(request('/api/members', { method: 'PATCH', jwt,
    body: { id: 'member-one', fullName: 'Updated' } }))).status, 200);
});
test('private saved items and statistics reject access to another member before querying', async () => {
  const jwt = await token();
  for (const [route, url] of [[interests, '/api/engagement/interest'], [stats, '/api/engagement/stats']]) {
    calls.length = 0;
    assert.equal((await route.GET(request(`${url}?memberId=member-two`, { jwt }))).status, 403);
    assert.equal(calls.length, 0);
  }
});

test('missing, placeholder and short JWT secrets fail closed', async () => {
  const validToken = await token();
  const saved = process.env.JWT_SECRET;
  for (const value of ['', 'short', 'your-jwt-secret-minimum-32-characters']) {
    process.env.JWT_SECRET = value;
    assert.equal(await sessions.verifySessionToken(validToken), null);
    assert.throws(() => sessions.getJwtSecret());
  }
  process.env.JWT_SECRET = saved;
});
test('expired, unsigned, wrong-algorithm, unexpiring and malformed claims are rejected', async () => {
  const candidates = [
    await token({}, { expiry: '-1s' }), await token({}, { noExpiry: true }),
    await token({}, { algorithm: 'HS384' }), await token({ role: 'root' }),
    await token({ memberId: null }), await token({ email: 42 }), 'e30.e30.',
  ];
  for (const candidate of candidates) assert.equal(await sessions.verifySessionToken(candidate), null);
});
test('member identity is normalized; invalid Authorization cannot fall back to a cookie', async () => {
  const jwt = await token();
  assert.equal((await sessions.verifySessionToken(jwt)).id, 'member-one');
  assert.equal(await sessions.verifyRequestSession(request('/api/members', {
    jwt, headers: { authorization: 'Bearer invalid' },
  })), null);
});
test('cross-site writes and Origin-less cookie writes are rejected', () => {
  for (const headers of [
    { origin: 'https://attacker.example' }, { origin: 'null' },
    { 'sec-fetch-site': 'cross-site', origin: 'http://localhost:2024' },
    { cookie: 'member_token=anything' },
    { cookie: 'member_token=anything', 'sec-fetch-site': 'same-site' },
  ]) assert.equal(policy.isSafeOrigin(request('/api/members', { method: 'PATCH', headers })), false);
  assert.equal(policy.isSafeOrigin(request('/api/members', { method: 'PATCH',
    headers: { cookie: 'member_token=anything', origin: 'http://localhost:2024' } })), true);
  assert.equal(policy.isSafeOrigin(request('/api/members', { method: 'PATCH',
    headers: { authorization: 'Bearer anything' } })), true);
});
test('role policy protects content, settings, broadcast, bulk actions and unknown APIs', () => {
  assert.equal(policy.apiRoles('/api/content', 'POST').includes('member'), false);
  assert.equal(policy.apiRoles('/api/settings', 'POST').includes('pr'), false);
  assert.equal(policy.apiRoles('/api/members/bulk', 'POST').includes('member'), false);
  assert.equal(policy.apiRoles('/api/broadcast/send', 'POST').includes('content-editor'), false);
  assert.deepEqual(policy.apiRoles('/api/new-private-endpoint', 'POST'), []);
});
test('rate limits reset at expiry and cannot be evicted by filling the store', () => {
  const limiter = new MemoryRateLimiter(2);
  assert.equal(limiter.consume('one', 2, 1000, 0).allowed, true);
  assert.equal(limiter.consume('one', 2, 1000, 0).remaining, 0);
  assert.equal(limiter.consume('one', 2, 1000, 0).allowed, false);
  assert.equal(limiter.consume('two', 2, 1000, 0).allowed, true);
  assert.equal(limiter.consume('three', 2, 1000, 0).allowed, false);
  assert.equal(limiter.consume('one', 2, 1000, 0).allowed, false);
  assert.equal(limiter.consume('three', 2, 1000, 1000).allowed, true);
});
test('production CSP uses a nonce and rejects inline script execution', () => {
  const saved = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const csp = contentSecurityPolicy('testnonce');
  const scripts = csp.split('; ').find((part) => part.startsWith('script-src'));
  assert.ok(scripts.includes("'nonce-testnonce'"));
  assert.ok(!scripts.includes('unsafe-inline'));
  assert.ok(!scripts.includes('unsafe-eval'));
  assert.ok(csp.includes("frame-ancestors 'self'"));
  if (saved === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = saved;
});
test('documents receive a fresh nonce and cannot reuse an injected nonce header', async () => {
  const first = await middleware(request('/news/news-platform', { headers: { 'x-nonce': 'injected' } }));
  const second = await middleware(request('/news/news-platform'));
  const a = first.headers.get('content-security-policy');
  const b = second.headers.get('content-security-policy');
  assert.ok(a.includes('nonce-'));
  assert.ok(!a.includes('nonce-injected'));
  assert.notEqual(a, b);
  assert.equal(first.headers.get('cache-control'), 'private, no-store');
});
test('oversized streamed JSON is rejected even without Content-Length', async () => {
  const response = await middleware(new NextRequest('http://localhost:2024/api/translate', {
    method: 'POST', headers: { origin: 'http://localhost:2024', 'content-type': 'application/json' },
    body: 'x'.repeat(1024 * 1024 + 1),
  }));
  assert.equal(response.status, 413);
  const ordinary = request('/api/translate', { method: 'POST', body: { target: 'en', fields: {} } });
  assert.equal((await middleware(ordinary)).status, 200);
  assert.deepEqual(await ordinary.json(), { target: 'en', fields: {} });
  assert.equal(policy.maxBodyBytes('/api/content/item/gallery'), 6 * 1024 * 1024);
});
test('production test-data endpoint is disabled', async () => {
  const saved = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try { assert.equal((await middleware(request('/api/admin/test-setup', { method: 'POST' }))).status, 404); }
  finally { if (saved === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = saved; }
});
test('database rate limits fail closed and transmit only an HMAC bucket identity', async () => {
  const savedStore = process.env.SECURITY_RATE_LIMIT_STORE;
  const savedFetch = global.fetch;
  process.env.SECURITY_RATE_LIMIT_STORE = 'database';
  let sent;
  try {
    global.fetch = async (_url, options) => {
      sent = JSON.parse(options.body);
      return Response.json({ rows: [{ result: JSON.stringify({ allowed: false, remaining: 0, retryAfter: 30 }) }] });
    };
    assert.equal((await consumeRateLimit('account:private@example.com', 5, 15000)).allowed, false);
    assert.match(sent.params[0], /^[a-f0-9]{64}$/);
    assert.deepEqual(sent.params.slice(1), [5, 15]);
    assert.equal(JSON.stringify(sent).includes('private@example.com'), false);
    global.fetch = async () => new Response('', { status: 503 });
    await assert.rejects(consumeRateLimit('unavailable', 5, 15000));
    const response = await middleware(request('/api/translate', { method: 'POST' }));
    assert.equal(response.status, 503);
  } finally { global.fetch = savedFetch; process.env.SECURITY_RATE_LIMIT_STORE = savedStore; }
});
test('upload rejects SVG and MIME spoofing; real images are re-encoded', async () => {
  const jwt = await token({ role: 'admin' });
  const makeUpload = (bytes, mime) => {
    const form = new FormData();
    form.set('file', new File([bytes], 'file', { type: mime }));
    return new NextRequest('http://localhost:2024/api/upload', {
      method: 'POST', headers: { cookie: `member_token=${jwt}` }, body: form,
    });
  };
  storedUploads = [];
  assert.equal((await upload.POST(makeUpload('<svg onload="alert(1)" />', 'image/svg+xml'))).status, 415);
  assert.equal((await upload.POST(makeUpload('<html>attack</html>', 'image/png'))).status, 415);
  // A truncated file has a valid prefix but must still fail decoding.
  assert.equal((await upload.POST(makeUpload(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'image/png'))).status, 415);
  assert.equal(storedUploads.length, 0);
  const sharp = require('sharp');
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'red' } }).png().toBuffer();
  assert.equal((await upload.POST(makeUpload(png, 'image/png'))).status, 200);
  assert.equal(storedUploads.length, 1);
  assert.equal(storedUploads[0][2], 'image/webp');
  assert.ok(matchesFileSignature(storedUploads[0][1], 'image/webp'));
});
test('content writes retain crop settings through the authenticated API', async () => {
  queryResult = { data: null, error: null };
  const crop = { x: 10, y: 20, width: 300, height: 200, scale: 1 };
  const response = await content.POST(request('/api/content', { method: 'POST',
    jwt: await token({ role: 'admin' }), body: { id: 'news-one', kind: 'news', title: 'News', coverImageCrop: crop } }));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).item.coverImageCrop, crop);
});
test('password reset commit passes both token and code to the atomic database verifier', async () => {
  queryResult = { data: { ok: false, error: 'Incorrect code' }, error: null };
  calls.length = 0;
  const response = await resets.POST(request('/api/members/reset-password', { method: 'POST',
    body: { id: 'reset-one', token: 'secret-link', code: '123456', newPassword: 'new-secure-password' } }));
  assert.equal(response.status, 401);
  const rpc = calls.find(([name]) => name === 'rpc');
  assert.equal(rpc?.[1], 'verify_security_password_reset');
  assert.ok(rpc[2].p_code_hash);
  assert.ok(rpc[2].p_token_hash);
  assert.match(rpc[2].p_password_hash, /^\$2[aby]\$12\$/);
  assert.ok(!calls.some(([name]) => name === 'update'));
});
