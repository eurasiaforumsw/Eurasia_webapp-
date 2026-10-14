const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) { return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
let rows;
let authorized;
let writeError;
let writes;
const database = { from() {
  let ids;
  let update;
  let deleting = false;
  const query = { in(_field, values) { ids = values; return query; }, update(value) { update = value; return query; },
    delete() { deleting = true; return query; }, select(field) { assert.equal(field, 'id'); return query; },
    then(resolve, reject) { writes++;
      if (writeError) return Promise.resolve({ data: null, error: { message: writeError } }).then(resolve, reject);
      const actual = ids.filter((id) => rows.has(id));
      actual.forEach((id) => deleting ? rows.delete(id) : rows.set(id, { ...rows.get(id), ...update }));
      return Promise.resolve({ data: actual.map((id) => ({ id })), error: null, count: null }).then(resolve, reject);
    },
  }; return query;
} };
require.cache[path.join(root, 'lib/supabase.ts')] = { exports: { supabaseAdmin: database } };
require.cache[path.join(root, 'lib/db.ts')] = { exports: { db: database } };
require.cache[path.join(root, 'lib/api-auth.ts')] = { exports: { requireRole: async () => { if (!authorized) throw new Error('Unauthorized'); return { role: 'admin' }; } } };
require.cache[path.join(root, 'lib/auth/session.ts')] = { exports: { CONTENT_ROLES: ['admin', 'pr'] } };
const { NextRequest } = require('next/server');
const bulk = require('../app/api/content/bulk/route.ts');
function request(body, raw = false) { return new NextRequest('http://localhost/api/content/bulk', { method: 'POST', headers: { 'content-type': 'application/json' }, body: raw ? body : JSON.stringify(body) }); }
beforeEach(() => { rows = new Map([['one', { id: 'one', status: 'draft', category: 'Research' }], ['two', { id: 'two', status: 'draft', category: 'Research' }]]); authorized = true; writeError = null; writes = 0; });
test('bulk status/category/delete returns only persisted IDs and missing items as failed results', async () => {
  for (const [action, extra] of [['updateStatus', { status: 'published' }], ['updateCategory', { category: 'Practice' }], ['delete', {}]]) {
    const response = await bulk.POST(request({ action, ids: [' one ', 'one', 'absent'], ...extra }));
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.success, false);
    assert.equal(data.affected, 1);
    assert.deepEqual(data.ids, ['one']);
    assert.deepEqual(data.missingIds, ['absent']);
    assert.deepEqual(data.results, [{ id: 'one', success: true }, { id: 'absent', success: false, error: 'Content not found or no longer available' }]);
    if (action === 'updateStatus') assert.equal(rows.get('one').status, 'published');
    if (action === 'updateCategory') assert.equal(rows.get('one').category, 'Practice');
  }
  assert.equal(rows.has('one'), false);
  assert.equal(rows.get('two').status, 'draft');
});
test('all missing items affect zero rows instead of claiming successful mutations', async () => {
  const data = await (await bulk.POST(request({ action: 'delete', ids: ['absent'] }))).json();
  assert.equal(data.affected, 0); assert.equal(data.success, false); assert.deepEqual(data.ids, []);
});
test('invalid payloads, oversized batches, invalid status and category never reach the database', async () => {
  for (const body of [null, [], { action: 'delete', ids: [] }, { action: 'delete', ids: ['one', 7] },
    { action: 'delete', ids: Array(101).fill('one') }, { action: 'delete', ids: ['x'.repeat(201)] },
    { action: 'updateStatus', ids: ['one'], status: ['published'] }, { action: 'updateCategory', ids: ['one'], category: 'x'.repeat(101) }]) {
    assert.equal((await bulk.POST(request(body))).status, 400);
  }
  assert.equal((await bulk.POST(request('{', true))).status, 400);
  assert.equal(writes, 0);
});
test('authorization and DB errors return no affected IDs and preserve persisted rows', async () => {
  authorized = false;
  assert.equal((await bulk.POST(request({ action: 'delete', ids: ['one'] }))).status, 401);
  authorized = true; writeError = 'Database unavailable';
  const response = await bulk.POST(request({ action: 'delete', ids: ['one'] }));
  assert.equal(response.status, 500);
  const data = await response.json();
  assert.equal(data.affected, 0); assert.deepEqual(data.ids, []); assert.equal(data.results[0].success, false);
  assert.equal(rows.has('one'), true);
});
