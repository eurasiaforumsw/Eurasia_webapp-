const assert = require('node:assert/strict');
const { test, beforeEach, afterEach } = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, filename);

const client = require('../lib/content-engagement.ts');
const savedWindow = global.window;
const savedFetch = global.fetch;
const visitor = 'visitor1234567890';
const stats = (contentId, extra = {}) => ({ contentId, viewCount: 0, downloadCount: 0, likeCount: 0, liked: false, ...extra });
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

beforeEach(() => {
  client.clearEngagementData();
  global.window = { localStorage: { getItem: () => visitor, setItem() {} }, dispatchEvent() {} };
});
afterEach(() => {
  global.window = savedWindow;
  global.fetch = savedFetch;
});

test('an uncached toggle reads a persisted like before choosing unlike', async () => {
  const contentId = 'paper,a';
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push(options?.method || 'GET');
    if (options?.method !== 'POST') {
      assert.deepEqual(new URL(url, 'http://localhost').searchParams.getAll('id'), [contentId]);
      return Response.json({ items: [stats(contentId, { liked: true, likeCount: 1 })] });
    }
    assert.equal(JSON.parse(options.body).contentId, contentId);
    assert.equal(JSON.parse(options.body).action, 'unlike');
    return Response.json({ item: stats(contentId) });
  };
  const result = await client.toggleLike(contentId);
  assert.deepEqual(calls, ['GET', 'POST']);
  assert.equal(result.liked, false);
  assert.equal(result.engagement.likeCount, 0);
});

test('batched reads preserve exact comma, Unicode and URL punctuation IDs', async () => {
  const ids = ['paper,a', 'เอกสารไทย&?#/一', 'paper', 'a'];
  global.fetch = async (url) => {
    const params = new URL(url, 'http://localhost').searchParams;
    assert.deepEqual(params.getAll('id'), ids);
    assert.equal(params.get('visitorId'), visitor);
    return Response.json({ items: ids.map((id, index) => stats(id, {
      viewCount: index + 1, likeCount: index === 0 ? 1 : 0, liked: index === 0,
    })) });
  };
  const loaded = await client.loadContentEngagement(ids);
  assert.deepEqual(loaded.map((item) => item.contentId), ids);
  assert.equal(client.getContentEngagement('paper,a').viewCount, 1);
  assert.equal(client.getContentEngagement('เอกสารไทย&?#/一').viewCount, 2);
  assert.equal(client.hasUserLiked('paper,a'), true);
  assert.equal(client.hasUserLiked('paper'), false);
});

test('view, toggle and download mutations run in order for one document', async () => {
  const view = deferred();
  const calls = [];
  global.fetch = async (url, options) => {
    const action = JSON.parse(options.body).action;
    calls.push(action);
    if (action === 'view') return view.promise;
    return Response.json({ item: stats('paper', {
      viewCount: 1, liked: true, likeCount: 1, downloadCount: action === 'download' ? 1 : 0,
    }) });
  };
  const pendingView = client.incrementViewCount('paper');
  const pendingLike = client.toggleLike('paper');
  const pendingDownload = client.incrementDownloadCount('paper');
  await tick();
  assert.deepEqual(calls, ['view']);
  view.resolve(Response.json({ item: stats('paper', { viewCount: 1 }) }));
  await Promise.all([pendingView, pendingLike, pendingDownload]);
  assert.deepEqual(calls, ['view', 'like', 'download']);
  assert.equal(client.hasUserLiked('paper'), true);
  assert.equal(client.getContentEngagement('paper').downloadCount, 1);
});

test('a delayed query cannot overwrite a saved like or newer counts', async () => {
  const read = deferred();
  global.fetch = async (url, options) => options?.method === 'POST'
    ? Response.json({ item: stats('paper', { viewCount: 2, liked: true, likeCount: 1 }) })
    : read.promise;
  const pendingRead = client.loadContentEngagement(['paper']);
  await client.incrementViewCount('paper');
  read.resolve(Response.json({ items: [stats('paper', { viewCount: 1 })] }));
  const loaded = await pendingRead;
  assert.equal(client.hasUserLiked('paper'), true);
  assert.equal(client.getContentEngagement('paper').viewCount, 2);
  assert.equal(loaded[0].viewCount, 2);
  assert.equal(loaded[0].likedBy.includes(visitor), true);
});

test('a query started during a mutation cannot replace its saved response', async () => {
  const write = deferred();
  const read = deferred();
  global.fetch = async (url, options) => options?.method === 'POST' ? write.promise : read.promise;
  const pendingWrite = client.incrementViewCount('paper');
  const pendingRead = client.loadContentEngagement(['paper']);
  write.resolve(Response.json({ item: stats('paper', { viewCount: 2, liked: true, likeCount: 1 }) }));
  await pendingWrite;
  read.resolve(Response.json({ items: [stats('paper', { viewCount: 1 })] }));
  await pendingRead;
  assert.equal(client.hasUserLiked('paper'), true);
  assert.equal(client.getContentEngagement('paper').viewCount, 2);
});

test('an older query cannot replace the result of a newer query', async () => {
  const oldRead = deferred();
  let reads = 0;
  global.fetch = async () => ++reads === 1 ? oldRead.promise
    : Response.json({ items: [stats('paper', { liked: true, likeCount: 3 })] });
  const pendingOldRead = client.loadContentEngagement(['paper']);
  await client.loadContentEngagement(['paper']);
  oldRead.resolve(Response.json({ items: [stats('paper')] }));
  await pendingOldRead;
  assert.equal(client.hasUserLiked('paper'), true);
  assert.equal(client.getContentEngagement('paper').likeCount, 3);
});

test('a pending document mutation does not block a different document', async () => {
  const first = deferred();
  const calls = [];
  global.fetch = async (url, options) => {
    const { contentId } = JSON.parse(options.body);
    calls.push(contentId);
    return contentId === 'first' ? first.promise : Response.json({ item: stats(contentId, { viewCount: 1 }) });
  };
  const pendingFirst = client.incrementViewCount('first');
  await client.incrementViewCount('second');
  assert.deepEqual(calls, ['first', 'second']);
  assert.equal(client.getContentEngagement('first').viewCount, 0);
  assert.equal(client.getContentEngagement('second').viewCount, 1);
  first.resolve(Response.json({ item: stats('first', { viewCount: 1 }) }));
  await pendingFirst;
});

test('a rejected mutation leaves the cache unchanged and does not block the next mutation', async () => {
  let writes = 0;
  global.fetch = async () => ++writes === 1
    ? Response.json({ error: 'Database offline' }, { status: 503 })
    : Response.json({ item: stats('paper', { downloadCount: 1 }) });
  const pendingView = client.incrementViewCount('paper');
  const pendingDownload = client.incrementDownloadCount('paper');
  await assert.rejects(pendingView, /Database offline/);
  assert.equal(client.getContentEngagement('paper').viewCount, 0);
  await pendingDownload;
  assert.equal(client.getContentEngagement('paper').downloadCount, 1);
});
