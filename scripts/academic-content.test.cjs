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
require.extensions['.ts'] = (module, filename) => {
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  module._compile(source, filename);
};

const rows = new Map();
let readError = null;
const database = {
  from() {
    let action = 'select';
    let payload;
    const filters = [];
    const result = (single = false) => {
      if (action === 'select' && readError) return { data: null, error: { message: readError } };
      const matching = [...rows.values()].filter((row) => filters.every(([field, value]) => row[field] === value));
      if (action === 'insert') rows.set(payload.id, { ...payload });
      if (action === 'update') matching.forEach((row) => rows.set(row.id, { ...row, ...payload }));
      if (action === 'delete') matching.forEach((row) => rows.delete(row.id));
      const data = action === 'insert' ? [rows.get(payload.id)]
        : action === 'update' ? matching.map((row) => rows.get(row.id)) : matching;
      return { data: single ? data[0] || null : data, error: null };
    };
    const query = {
      select() { return query; },
      eq(field, value) { filters.push([field, value]); return query; },
      order() { return query; },
      insert(value) { action = 'insert'; payload = value; return query; },
      update(value) { action = 'update'; payload = value; return query; },
      delete() { action = 'delete'; return query; },
      maybeSingle() { return Promise.resolve(result(true)); },
      single() { return Promise.resolve(result(true)); },
      execute() { return Promise.resolve(result()); },
      then(onFulfilled, onRejected) { return Promise.resolve(result()).then(onFulfilled, onRejected); },
    };
    return query;
  },
};
require.cache[path.join(root, 'lib/supabase.ts')] = { exports: { supabaseAdmin: database, supabase: database } };
require.cache[path.join(root, 'lib/db.ts')] = { exports: { db: database, query: async () => ({ rows: [{ membership_type: "professional", target_groups: ["Educators"] }] }) } };
let authorized = true;
let viewerSession = null;
require.cache[path.join(root, 'lib/api-auth.ts')] = { exports: {
  requireRole: async () => { if (!authorized) throw new Error('Unauthorized'); return { role: 'admin' }; },
} };
require.cache[path.join(root, 'lib/auth/session.ts')] = { exports: {
  CONTENT_ROLES: ['admin', 'pr', 'content-editor', 'super-admin'],
  verifyRequestSession: async () => viewerSession,
} };
const uploads = [];
require.cache[path.join(root, 'lib/r2.ts')] = { exports: {
  uploadToR2: async (...args) => { uploads.push(args); return `https://media.example.invalid/${args[0]}`; },
} };

const { NextRequest } = require('next/server');
const content = require('../app/api/content/route.ts');
const publicContent = require('../app/api/content/public/route.ts');
const upload = require('../app/api/admin/content/upload-file/route.ts');
const storage = new Map();
global.window = { localStorage: {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
} };
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.invalid';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-public-key';
const admin = require('../lib/admin-data.ts');

function request(method, body, query = '') {
  return new NextRequest(`http://localhost:2024/api/content${query}`, {
    method, ...(body ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
}
const document = {
  id: 'academic-one', kind: 'academic', title: 'Evidence for practice', category: 'Research',
  summary: 'Field evidence.', body: '<p>Research findings.</p>', author: 'Dr. Example',
  authorImage: 'https://media.example.invalid/portrait.webp', featured: true,
  status: 'published', locale: 'en', updatedAt: '2026-10-12T00:00:00Z',
  fileUrl: 'https://media.example.invalid/research.pdf', fileName: 'research.pdf',
  fileType: 'application/pdf', fileSize: 12500, pageCount: 12,
  coverImageCrop: { x: 0, y: 0, width: 100, height: 100, scale: 1 },
};

test('academic metadata survives create, public read, edit, file removal, and delete', async () => {
  rows.clear();
  const created = await content.POST(request('POST', document));
  assert.equal(created.status, 200);
  const { item } = await created.json();
  for (const field of ['fileUrl', 'fileName', 'fileType', 'fileSize', 'pageCount', 'authorImage', 'featured']) {
    assert.deepEqual(item[field], document[field], field);
  }
  const visible = await publicContent.GET(new Request('http://localhost:2024/api/content/public?kind=academic'));
  const { items } = await visible.json();
  assert.equal(items.length, 1);
  assert.deepEqual(items[0].coverImageCrop, document.coverImageCrop);
  assert.equal(items[0].fileUrl, document.fileUrl);
  assert.equal(items[0].authorImage, document.authorImage);

  const updated = await content.PATCH(request('PATCH', { ...document, title: 'Updated evidence', featured: false }));
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).item.featured, false);
  const removed = await content.POST(request('POST', { ...document, fileUrl: undefined,
    fileName: undefined, fileType: undefined, fileSize: undefined, pageCount: undefined }));
  assert.equal(removed.status, 200);
  assert.equal((await removed.json()).item.fileUrl, undefined);
  assert.equal((await content.DELETE(request('DELETE', null, '?id=academic-one'))).status, 200);
  assert.equal(rows.size, 0);
});

test('unfiltered public feed returns published content across kinds and both filters select one item', async () => {
  rows.clear();
  for (const [id, kind, status] of [['academic-one', 'academic', 'published'], ['news-one', 'news', 'published'], ['draft-one', 'news', 'draft']]) {
    assert.equal((await content.POST(request('POST', { ...document, id, kind, status }))).status, 200);
  }
  const all = await publicContent.GET(new Request('http://localhost:2024/api/content/public'));
  assert.deepEqual((await all.json()).items.map((item) => item.id).sort(), ['academic-one', 'news-one']);
  const one = await publicContent.GET(new Request('http://localhost:2024/api/content/public?kind=news&slug=news-one'));
  assert.deepEqual((await one.json()).items.map((item) => item.id), ['news-one']);
});

test('full saves preserve creation date and partial updates preserve omitted content and attachments', async () => {
  rows.clear();
  assert.equal((await content.POST(request('POST', document))).status, 200);
  const createdAt = '2025-01-01T00:00:00.000Z';
  rows.get(document.id).created_at = createdAt;
  assert.equal((await content.POST(request('POST', { ...document, title: 'New title' }))).status, 200);
  assert.equal(rows.get(document.id).created_at, createdAt);
  const updated = await content.PATCH(request('PATCH', { id: document.id, featured: false }));
  assert.equal(updated.status, 200);
  const { item } = await updated.json();
  assert.equal(item.featured, false);
  assert.equal(item.title, 'New title');
  assert.equal(item.body, document.body);
  assert.equal(item.fileUrl, document.fileUrl);
  assert.equal(item.authorImage, document.authorImage);
  assert.equal(rows.get(document.id).created_at, createdAt);
  const removed = await content.PATCH(request('PATCH', { id: document.id, fileUrl: null, fileName: null }));
  assert.equal(removed.status, 200);
  assert.equal((await removed.json()).item.fileUrl, undefined);
});

test('missing partial update returns 404 and failed existence reads cannot create or overwrite content', async () => {
  rows.clear();
  assert.equal((await content.PATCH(request('PATCH', { id: 'missing', title: 'Title' }))).status, 404);
  readError = 'Database read failed';
  assert.equal((await content.POST(request('POST', document))).status, 500);
  assert.equal((await content.PATCH(request('PATCH', { id: document.id, featured: false }))).status, 500);
  assert.equal(rows.size, 0);
  readError = null;
});

test('failed remote save and delete keep existing content available for retry', async () => {
  storage.set(admin.ADMIN_CONTENT_KEY, JSON.stringify([document]));
  global.fetch = async () => new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 503 });
  await assert.rejects(admin.saveAdminContentRemote({ ...document, title: 'Unsaved title' }), /Database unavailable/);
  assert.equal(admin.getAdminContent()[0].title, document.title);
  await assert.rejects(admin.deleteAdminContentRemote(document.id), /Database unavailable/);
  assert.equal(admin.getAdminContent().length, 1);
});

test('remote sync does not restore a deleted record from stale local storage', async () => {
  storage.set(admin.ADMIN_CONTENT_KEY, JSON.stringify([document]));
  let writes = 0;
  global.fetch = async (_url, options) => {
    if (options?.method === 'POST') writes++;
    return new Response(JSON.stringify({ items: [] }), { status: 200 });
  };
  assert.deepEqual(await admin.syncAdminContent(), []);
  assert.equal(writes, 0);
});

test('academic category kind survives saved filter configuration', () => {
  admin.saveAdminContentCategories([{ id: 'research', kind: 'academic', label: 'Research', order: 0, enabled: true }]);
  assert.equal(admin.getAdminContentCategories('academic')[0]?.label, 'Research');
});

function uploadRequest(bytes, type = 'application/pdf') {
  const form = new FormData();
  form.append('file', new Blob([bytes], { type }), 'research.pdf');
  form.append('contentId', 'academic-one');
  return new NextRequest('http://localhost:2024/api/admin/content/upload-file', { method: 'POST', body: form });
}
test('academic upload stores one valid attachment in durable R2 storage', async () => {
  uploads.length = 0;
  const response = await upload.POST(uploadRequest('%PDF-1.7\nresearch'));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.match(result.fileUrl, /^https:\/\/media\.example\.invalid\/academic\//);
  assert.equal(uploads.length, 1);
  assert.equal(uploads[0][2], 'application/pdf');
});

test('academic upload rejects an unauthenticated caller and a forged PDF', async () => {
  const count = uploads.length;
  authorized = false;
  assert.equal((await upload.POST(uploadRequest('%PDF-1.7\ntest'))).status, 401);
  authorized = true;
  assert.equal((await upload.POST(uploadRequest('<html>not a PDF</html>'))).status, 415);
  assert.equal(uploads.length, count);
});

test('scheduled, private, draft, and archived academic items stay out of the public library', async () => {
  rows.clear();
  for (const [id, patch] of [
    ['future', { publishAt: '2099-01-01T00:00:00Z' }],
    ['expired', { expiresAt: '2000-01-01T00:00:00Z' }],
    ['private', { targetMembershipTypes: ['professional'] }],
    ['draft', { status: 'draft' }],
    ['archived', { status: 'archived' }],
  ]) {
    assert.equal((await content.POST(request('POST', { ...document, id, ...patch }))).status, 200);
  }
  const response = await publicContent.GET(new Request('http://localhost:2024/api/content/public?kind=academic'));
  assert.deepEqual((await response.json()).items, []);
});

test('academic upload rejects empty and oversized files without writing storage', async () => {
  const count = uploads.length;
  assert.equal((await upload.POST(uploadRequest(''))).status, 413);
  assert.equal((await upload.POST(uploadRequest(new Uint8Array(4 * 1024 * 1024 + 1)))).status, 413);
  assert.equal(uploads.length, count);
});

test('query parameters cannot grant restricted audience access; active signed member audience can', async () => {
  rows.clear();viewerSession=null;
  const privateDoc={...document,id:'private-doc',targetMembershipTypes:['professional'],targetGroups:['Educators']};
  assert.equal((await content.POST(request('POST',privateDoc))).status,200);
  const spoofed=await publicContent.GET(new Request('http://localhost/api/content/public?membership=professional&groups=Educators'));
  assert.deepEqual((await spoofed.json()).items,[]);
  viewerSession={id:'member-one',role:'member'};
  const signed=await publicContent.GET(new Request('http://localhost/api/content/public'));
  assert.equal((await signed.json()).items[0].id,'private-doc');
  viewerSession=null;
});
