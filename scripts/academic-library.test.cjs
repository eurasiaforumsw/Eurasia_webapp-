const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText, filename);
  };
}
const { getLibraryDocuments, getLibraryAuthors, filterLibraryDocuments } = require('../lib/academic-library.ts');
const policy = require('../lib/security/policy.ts');
const sample = {
  id: 'research-one', kind: 'academic', category: 'Regional research', title: 'Community research',
  summary: 'Evidence for rural practice', body: '', author: ' Dr. Example ', authorImage: '/portrait.webp',
  tags: ['Community', 'Research'], status: 'published', locale: 'en', updatedAt: '2026-10-10T00:00:00Z',
};
const now = Date.parse('2026-10-12T00:00:00Z');

test('the library includes published academic and legacy documents and excludes inaccessible records', () => {
  const items = [sample, { ...sample, id: 'legacy', kind: 'document' },
    ...[{ kind: 'news' }, { status: 'draft' }, { status: 'archived' }, { publishAt: '2026-10-13T00:00:00Z' },
      { expiresAt: '2026-10-11T00:00:00Z' }, { targetMembershipTypes: ['professional'] }, { targetGroups: ['youth'] }]
      .map((patch, index) => ({ ...sample, id: `hidden-${index}`, ...patch }))];
  assert.deepEqual(getLibraryDocuments(items, now).map((item) => item.id), ['research-one', 'legacy']);
});

test('an empty published collection stays empty, without fabricated documents or metrics', () => {
  assert.deepEqual(getLibraryDocuments([], now), []);
  const [doc] = getLibraryDocuments([sample], now);
  assert.equal(doc.downloadCount, undefined);
  assert.equal(doc.featured, undefined);
  assert.equal(doc.pageCount, undefined);
});

test('authors aggregate normalized names and preserve editable portraits', () => {
  const docs = getLibraryDocuments([sample, { ...sample, id: 'two', author: 'dr. example', authorImage: undefined, updatedAt: '2026-10-11T00:00:00Z' }], now);
  assert.deepEqual(getLibraryAuthors(docs), [{ id: 'dr. example', name: 'Dr. Example', profileImage: '/portrait.webp', documentCount: 2, totalViews: 0, latestDate: '2026-10-11T00:00:00Z' }]);
});

test('custom categories, author, topic and trimmed search combine without mutating the collection', () => {
  const docs = getLibraryDocuments([sample, { ...sample, id: 'two', category: 'Practice', title: 'Clinical guide', author: 'Other author' }], now);
  const filtered = filterLibraryDocuments(docs, { query: ' RURAL ', category: 'Regional research', author: 'dr. example', tags: ['Community'], sort: 'newest' });
  assert.deepEqual(filtered.map((item) => item.id), ['research-one']);
  assert.deepEqual(docs.map((item) => item.id), ['research-one', 'two']);
});

test('popular order uses persisted download counts and newest uses saved publication dates', () => {
  const docs = getLibraryDocuments([sample, { ...sample, id: 'two', downloadCount: 20, publishAt: '2026-10-11T00:00:00Z' }], now);
  const filters = { query: '', category: null, author: null, tags: [], sort: 'popular' };
  assert.deepEqual(filterLibraryDocuments(docs, filters).map((item) => item.id), ['two', 'research-one']);
  assert.deepEqual(filterLibraryDocuments(docs, { ...filters, sort: 'oldest' }).map((item) => item.id), ['research-one', 'two']);
});

test('academic attachments permit content editors and a 4 MB file plus multipart overhead', () => {
  const uploadPath = '/api/admin/content/upload-file';
  assert.ok(policy.apiRoles(uploadPath, 'POST').includes('content-editor'));
  assert.ok(!policy.apiRoles(uploadPath, 'POST').includes('member'));
  assert.ok(policy.maxBodyBytes(uploadPath) > 4 * 1024 * 1024);
  assert.equal(policy.ratePolicy(uploadPath).scope, 'upload');
});
