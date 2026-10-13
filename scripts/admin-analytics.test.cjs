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

let tables = {};
let failingTable = null;
let authorized = true;
const calls = [];
const database = {
  from(table) {
    calls.push(['from', table]);
    let fields = '*';
    let options = {};
    let offset = 0;
    let end = Infinity;
    let action = 'read';
    let payload;
    const filters = [];
    const result = () => {
      if (table === failingTable) return { data: null, count: null, error: { message: `${table} unavailable` } };
      if (!Object.hasOwn(tables, table)) return { data: null, count: null, error: { message: `missing table ${table}` } };
      const matching = tables[table].filter((row) => filters.every((filter) => filter(row)));
      if (action === 'delete') tables[table] = tables[table].filter((row) => !matching.includes(row));
      if (action === 'upsert' && !tables[table].some((row) => ['content_id', 'visitor_id', 'event_type', 'bucket_key'].every((key) => row[key] === payload[key]))) {
        tables[table].push({ id: tables[table].length + 1, occurred_at: new Date().toISOString(), ...payload });
      }
      const rows = matching.slice(offset, end + 1);
      if (fields !== '*' && rows.length && fields.split(',').some((field) => !Object.hasOwn(rows[0], field.trim()))) {
        return { data: null, error: { message: `Invalid columns: ${fields}` } };
      }
      return { data: options.head ? null : rows, count: matching.length, error: null };
    };
    const query = {
      select(value, opts = {}) { fields = value; options = opts; calls.push(['select', table, value]); return query; },
      eq(key, value) { filters.push((row) => row[key] === value); return query; },
      in(key, values) { filters.push((row) => values.includes(row[key])); return query; },
      gte(key, value) { filters.push((row) => row[key] >= value); calls.push(['gte', table, key, value]); return query; },
      lte(key, value) { filters.push((row) => row[key] <= value); return query; },
      lt(key, value) { filters.push((row) => row[key] < value); return query; },
      order() { return query; },
      range(start, finish) { offset = start; end = finish; calls.push(['range', table, start]); return query; },
      delete() { action = 'delete'; return query; },
      upsert(value) { action = 'upsert'; payload = value; return query; },
      then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
    };
    return query;
  },
};
require.cache[path.join(root, 'lib/supabase.ts')] = { exports: { supabaseAdmin: database } };
require.cache[path.join(root, 'lib/api-auth.ts')] = { exports: { requireRole: async () => {
  if (!authorized) throw new Error('Unauthorized'); return { role: 'admin' };
} } };
const { NextRequest } = require('next/server');
const overview = require('../app/api/admin/analytics/overview/route.ts');
const content = require('../app/api/admin/analytics/content/route.ts');
const members = require('../app/api/admin/analytics/members/route.ts');
const engagement = require('../app/api/admin/analytics/engagement/route.ts');
const academic = require('../app/api/admin/analytics/academic/route.ts');
const activity = require('../app/api/academic/engagement/route.ts');
const client = require('../lib/content-engagement.ts');
function request(pathname = '', body) {
  return new NextRequest(`http://localhost:2024${pathname || '/api/admin/analytics/engagement?range=7d'}`, {
    ...(body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
}
const ago = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
const document = (id, kind = 'academic', extra = {}) => ({ id, kind, title: id, author: 'Author', status: 'published',
  created_at: ago(60), file_name: 'paper.pdf', file_size: 100, publish_at: null, expires_at: null,
  target_membership_types: [], target_groups: [], file_url: '/paper.pdf', ...extra });
beforeEach(() => {
  authorized = true;
  failingTable = null;
  calls.length = 0;
  tables = { content: [document('paper'), document('legacy', 'document'), document('news', 'news')],
    members: [{ id: 'member', full_name: 'Reader', email: 'r@example.invalid', country: 'TH', membership_type: 'professional', joined_at: ago(2) }],
    content_likes: [{ id: 'like', content_id: 'paper', member_id: 'member', created_at: ago(2) }],
    member_interests: [], content_views: [{ id: 'view', content_id: 'paper', visitor_id: 'visitor-one', viewed_at: ago(2) }],
    member_activity: [{ id: 'act', member_id: 'member', created_at: ago(2) }], content_shares: [], member_sessions: [],
    academic_document_engagement: [] };
});

test('7/30/90 day charts use persisted schema timestamps and exclude older events', async () => {
  tables.content_likes.push({ id: 'old', content_id: 'paper', created_at: ago(10) });
  for (const days of [7, 30, 90]) {
    const response = await engagement.GET(request(`/api/admin/analytics/engagement?range=${days}d`));
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.likes.length, days);
    assert.equal(data.likes.reduce((sum, day) => sum + day.value, 0), days === 7 ? 1 : 2);
    assert.equal(data.views.reduce((sum, day) => sum + day.value, 0), 1);
    assert.equal(data.newMembers.reduce((sum, day) => sum + day.value, 0), 1);
  }
});

test('overview uses kind and published content, and growth uses the requested period', async () => {
  tables.content.push(document('draft', 'academic', { status: 'draft' }));
  tables.members.push({ ...tables.members[0], id: 'older', joined_at: ago(15) });
  tables.members.push({ ...tables.members[0], id: 'oldest', joined_at: ago(60) });
  const seven = await (await overview.GET(request('/api/admin/analytics/overview?range=7d'))).json();
  const thirty = await (await overview.GET(request('/api/admin/analytics/overview?range=30d'))).json();
  assert.equal(seven.content.total, 3);
  assert.equal(seven.content.news, 1);
  assert.equal(seven.members.newInPeriod, 1);
  assert.equal(thirty.members.newInPeriod, 2);
  assert.equal(seven.members.growth, 50);
});

test('rankings and active members use real engagement tables and selected range', async () => {
  tables.content_likes.push({ id: 'old', content_id: 'news', created_at: ago(10) });
  tables.member_activity.push({ id: 'old', member_id: 'member', created_at: ago(10) });
  const result = await (await content.GET(request('/api/admin/analytics/content?range=7d'))).json();
  assert.deepEqual(result.topLiked.map((row) => row.id), ['paper']);
  assert.equal(result.topViewed[0].id, 'paper');
  const people = await (await members.GET(request('/api/admin/analytics/members?range=7d'))).json();
  assert.equal(people.mostActiveMembers[0].engagementCount, 1);
  assert.equal(people.newMembers.count, 1);
});

test('pagination includes engagement beyond Supabase first 1,000 rows', async () => {
  tables.content_views = Array.from({ length: 1101 }, (_, index) => ({ id: index, content_id: 'paper', viewed_at: ago(1) }));
  const data = await (await engagement.GET(request())).json();
  assert.equal(data.views.reduce((sum, day) => sum + day.value, 0), 1101);
  assert.ok(calls.some((call) => call[0] === 'range' && call[1] === 'content_views' && call[2] === 1000));
});

test('analytics fail visibly on database errors and reject unauthorized or invalid-range requests', async () => {
  for (const route of [overview, content, members, engagement]) {
    authorized = false;
    assert.equal((await route.GET(request())).status, 401);
    authorized = true;
    assert.equal((await route.GET(request('/api/admin/analytics?range=1y'))).status, 400);
  }
  for (const [route, table] of [[overview, 'content_likes'], [content, 'content_views'], [members, 'member_activity'], [engagement, 'member_interests']]) {
    failingTable = table;
    const response = await route.GET(request());
    assert.equal(response.status, 500);
    assert.match((await response.json()).error, /unavailable/);
  }
});

test('academic stats combine both document kinds and count stored actions across visitors', async () => {
  tables.academic_document_engagement = [
    { id: 1, content_id: 'paper', visitor_id: 'visitor1234567890', event_type: 'download' },
    { id: 2, content_id: 'legacy', visitor_id: 'another1234567890', event_type: 'view' },
    { id: 3, content_id: 'paper', visitor_id: 'visitor1234567890', event_type: 'like' },
  ];
  const data = await (await academic.GET(request('/api/admin/analytics/academic'))).json();
  assert.equal(data.documents.length, 2);
  assert.equal(data.documents.find((row) => row.id === 'paper').downloads, 1);
  assert.equal(data.documents.find((row) => row.id === 'legacy').views, 1);
  failingTable = 'academic_document_engagement';
  assert.equal((await academic.GET(request('/api/admin/analytics/academic'))).status, 500);
});

test('public activity supports slug IDs, deduplicates repeated views, and saves/removes likes', async () => {
  const send = (action) => activity.POST(request('/api/academic/engagement', { contentId: 'paper', visitorId: 'visitor1234567890', action }));
  const first = await send('view');
  assert.equal(first.status, 200);
  await send('view');
  assert.equal(tables.academic_document_engagement.length, 1);
  await send('download');
  await send('like');
  await send('like');
  const data = await (await activity.GET(request('/api/academic/engagement?ids=paper&visitorId=visitor1234567890'))).json();
  assert.equal(data.items[0].viewCount, 1);
  assert.equal(data.items[0].downloadCount, 1);
  assert.equal(data.items[0].likeCount, 1);
  assert.equal(data.items[0].liked, true);
  assert.equal((await (await send('unlike')).json()).item.likeCount, 0);
});

test('repeated ID parameters preserve punctuation and Unicode IDs with distinct persisted counts and likes', async () => {
  const ids = ['paper,a', 'เอกสารไทย&?#/一', 'paper', 'a'];
  const visitorId = 'visitor1234567890';
  tables.content.push(...ids.filter((id) => id !== 'paper').map((id) => document(id)));
  const send = (contentId, action) => activity.POST(request('/api/academic/engagement', { contentId, visitorId, action }));
  await send(ids[0], 'view');
  await send(ids[0], 'like');
  await send(ids[1], 'view');
  await send(ids[1], 'download');
  const params = new URLSearchParams({ visitorId, ids: 'legacy' });
  ids.forEach((id) => params.append('id', id));
  const response = await activity.GET(request(`/api/academic/engagement?${params}`));
  assert.equal(response.status, 200);
  const { items } = await response.json();
  assert.deepEqual(items.map((item) => item.contentId).sort(), [...ids].sort());
  const byId = Object.fromEntries(items.map((item) => [item.contentId, item]));
  assert.equal(byId[ids[0]].viewCount, 1);
  assert.equal(byId[ids[0]].likeCount, 1);
  assert.equal(byId[ids[0]].liked, true);
  assert.equal(byId[ids[1]].viewCount, 1);
  assert.equal(byId[ids[1]].downloadCount, 1);
  assert.equal(byId[ids[1]].liked, false);
  assert.equal(byId.paper.viewCount, 0);
  assert.equal(byId.paper.liked, false);
  assert.equal(byId.a.likeCount, 0);
  const legacy = await (await activity.GET(request('/api/academic/engagement?ids=paper,legacy'))).json();
  assert.deepEqual(legacy.items.map((item) => item.contentId).sort(), ['legacy', 'paper']);
});

test('activity cannot expose/record hidden documents or download without attachment', async () => {
  assert.equal((await activity.POST(request('/api/academic/engagement', { contentId: 'paper', visitorId: 'visitor1234567890', action: ['view'] }))).status, 400);
  for (const patch of [{ status: 'draft' }, { publish_at: ago(-10) }, { expires_at: ago(1) }, { target_groups: ['private'] }, { kind: 'news' }]) {
    tables.content[0] = document('paper', 'academic', patch);
    const response = await activity.POST(request('/api/academic/engagement', { contentId: 'paper', visitorId: 'visitor1234567890', action: 'view' }));
    assert.equal(response.status, 404);
    assert.deepEqual((await (await activity.GET(request('/api/academic/engagement?ids=paper'))).json()).items, []);
  }
  tables.content[0] = document('paper', 'academic', { file_url: null });
  assert.equal((await activity.POST(request('/api/academic/engagement', { contentId: 'paper', visitorId: 'visitor1234567890', action: 'download' }))).status, 400);
  assert.equal(tables.academic_document_engagement.length, 0);
});

test('client does not claim success or update counts after a rejected server write', async () => {
  const savedWindow = global.window;
  const savedFetch = global.fetch;
  global.window = { localStorage: { getItem: () => 'visitor1234567890', setItem() {} }, dispatchEvent() {} };
  client.clearEngagementData();
  global.fetch = async () => Response.json({ error: 'Database offline' }, { status: 503 });
  await assert.rejects(client.toggleLike('paper'), /Database offline/);
  await assert.rejects(client.incrementDownloadCount('paper'), /Database offline/);
  assert.equal(client.getContentEngagement('paper').likeCount, 0);
  global.window = savedWindow;
  global.fetch = savedFetch;
});
