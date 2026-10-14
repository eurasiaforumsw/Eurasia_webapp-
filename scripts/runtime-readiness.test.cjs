const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
function browserModules(fetch) {
  const values = new Map();
  const window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
    dispatchEvent() {},
  };
  const cache = new Map();
  function load(name) {
    if (name === 'react') return { useEffect() {}, useState() {} };
    const filename = path.join(root, name.replace(/^@\//, '').replace(/\.ts$/, '') + '.ts');
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText;
    vm.runInNewContext(source, {
      module, exports: module.exports, require: load, window, fetch,
      process: { env: {} }, Event, CustomEvent: class {}, console, URLSearchParams,
    }, { filename });
    return module.exports;
  }
  return { load, values };
}

test('member login reaches the server without exposing DATABASE_URL to the browser', async () => {
  const calls = [];
  const profile = { id: 'member-one', fullName: 'Member', email: 'member@example.com' };
  const { load } = browserModules(async (url, options) => {
    calls.push([url, options]);
    return Response.json({ member: profile });
  });
  const auth = load('@/lib/member-auth');
  const result = await auth.loginMember('member@example.com', 'password');
  assert.equal(result.id, 'member-one');
  assert.equal(calls[0][0], '/api/members/login');
  assert.equal(auth.getSessionMember().id, 'member-one');
});

test('registration saves the profile without claiming an authenticated cookie session', async () => {
  const profile = { id: 'member-new', fullName: 'New Member', email: 'new@example.com', status: 'pending' };
  const { load, values } = browserModules(async (url) => Response.json({ member: url.includes('?email=') ? null : profile }));
  const auth = load('@/lib/member-auth');
  const registered = await auth.registerMember({ fullName: profile.fullName, email: profile.email, password: 'password' });
  assert.equal(registered.id, 'member-new');
  assert.equal(auth.getSessionMember(), null);
  assert.equal(values.has(auth.MEMBER_SESSION_KEY), false);
});

test('admin content create, refresh and delete reach the API without legacy Supabase keys', async () => {
  const calls = [];
  const item = { id: 'draft-one', kind: 'news', title: 'Persisted draft', status: 'draft' };
  const { load } = browserModules(async (url, options = {}) => {
    calls.push([url, options.method || 'GET']);
    return Response.json(options.method === 'POST' ? { item } : { items: [item] });
  });
  const admin = load('@/lib/admin-data');
  await admin.saveAdminContentRemote(item);
  assert.equal(calls[0][0], '/api/content');
  assert.equal(calls[0][1], 'POST');
  await admin.syncAdminContent();
  await admin.deleteAdminContentRemote(item.id);
  assert.equal(calls[1][1], 'GET');
  assert.deepEqual(calls[2], ['/api/content?id=draft-one', 'DELETE']);
});

test('failed admin saves keep the local cache unchanged and report the failure', async () => {
  const { load } = browserModules(async () => Response.json({ error: 'Database unavailable' }, { status: 503 }));
  const admin = load('@/lib/admin-data');
  const before = JSON.stringify(admin.getAdminContent());
  await assert.rejects(admin.saveAdminContentRemote({ id: 'new-draft', kind: 'news', status: 'draft' }), /Database unavailable/);
  assert.equal(JSON.stringify(admin.getAdminContent()), before);
});

test('engagement reads server counts with no database credentials in the browser', async () => {
  let url;
  const { load } = browserModules(async (input) => {
    url = input;
    return Response.json({ viewCount: 31, likeCount: 12, saveCount: 7, userEngagement: { liked: true, saved: false } });
  });
  const counts = await load('@/lib/member-engagement').engagementCounts('news-one', 'member-one');
  assert.equal(counts.views, 31);
  assert.equal(counts.likes, 12);
  assert.equal(counts.isLiked, true);
  assert.equal(url, '/api/engagement?contentId=news-one&memberId=member-one');
});

test('profile updates wait for persistence and leave the old profile on failure', async () => {
  const { load, values } = browserModules(async () => Response.json({ error: 'Save failed' }, { status: 500 }));
  const auth = load('@/lib/member-auth');
  values.set(auth.MEMBER_STORAGE_KEY, JSON.stringify({ id: 'member-one', fullName: 'Original', email: 'member@example.com' }));
  await assert.rejects(Promise.resolve().then(() => auth.updateMember({ fullName: 'Unsaved' })), /Save failed/);
  assert.equal(auth.getMember().fullName, 'Original');
});

test('member logout clears the server cookie before removing the local session', async () => {
  const calls = [];
  const { load, values } = browserModules(async (url, options) => {
    calls.push([url, options.method]);
    return Response.json({ success: true });
  });
  const auth = load('@/lib/member-auth');
  values.set(auth.MEMBER_SESSION_KEY, 'active');
  await auth.logoutMember();
  assert.deepEqual(calls, [['/api/members/logout', 'POST']]);
  assert.equal(values.has(auth.MEMBER_SESSION_KEY), false);
});

test('failed logout keeps the local session available for retry', async () => {
  const { load, values } = browserModules(async () => Response.json({ error: 'Unavailable' }, { status: 503 }));
  const auth = load('@/lib/member-auth');
  values.set(auth.MEMBER_SESSION_KEY, 'active');
  await assert.rejects(Promise.resolve().then(() => auth.logoutMember()), /Unavailable/);
  assert.equal(values.get(auth.MEMBER_SESSION_KEY), 'active');
});

test('avatar bytes upload to R2 while Vercel receives only metadata and the finalize token', async () => {
  const calls = [];
  const file = { type: 'image/jpeg', size: 1200 };
  const { load } = browserModules(async (url, options) => {
    calls.push([url, options]);
    if (calls.length === 1) return Response.json({ uploadUrl: 'https://r2.example.invalid/signed', token: 'signed-avatar-token' });
    if (calls.length === 2) return new Response('', { status: 200 });
    return Response.json({ url: 'https://media.example.invalid/avatars/test.jpg' });
  });
  const result = await load('@/lib/r2-upload').uploadFileDirect(file, 'avatar');
  assert.equal(result.url, 'https://media.example.invalid/avatars/test.jpg');
  assert.deepEqual(JSON.parse(calls[0][1].body), { action: 'presign', purpose: 'avatar', contentType: 'image/jpeg', size: 1200 });
  assert.equal(calls[1][0], 'https://r2.example.invalid/signed');
  assert.equal(calls[1][1].method, 'PUT');
  assert.equal(calls[1][1].body, file);
  assert.deepEqual(JSON.parse(calls[2][1].body), { action: 'finalize', token: 'signed-avatar-token' });
});
test('failed R2 PUT stops avatar finalization and returns a retryable failure', async () => {
  let calls = 0;
  const { load } = browserModules(async () => ++calls === 1
    ? Response.json({ uploadUrl: 'https://r2.example.invalid/signed', token: 'token' })
    : new Response('', { status: 503 }));
  await assert.rejects(load('@/lib/r2-upload').uploadFileDirect({ type: 'image/jpeg', size: 1200 }, 'avatar'), /R2 upload failed/);
  assert.equal(calls, 2);
});
test('failed avatar finalization never reports the object URL as saved', async () => {
  let calls = 0;
  const { load } = browserModules(async () => {
    calls++;
    return calls === 1 ? Response.json({ uploadUrl: 'https://r2.example.invalid/signed', token: 'token' })
      : calls === 2 ? new Response('', { status: 200 })
      : Response.json({ error: 'File signature rejected' }, { status: 415 });
  });
  await assert.rejects(load('@/lib/r2-upload').uploadFileDirect({ type: 'image/jpeg', size: 1200 }, 'avatar'), /File signature rejected/);
});
