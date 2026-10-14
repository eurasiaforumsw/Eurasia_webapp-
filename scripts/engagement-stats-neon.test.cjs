const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return originalResolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);

let session;
let rows;
require.cache[path.join(root, 'lib/auth/jwt.ts')] = { exports: {
  verifyMemberToken: async () => session,
} };
const pool = require('../lib/db.ts').default;
pool.connect = async () => ({
  query: async () => ({ rows, rowCount: rows.length }),
  release() {},
});
const { NextRequest } = require('next/server');
const stats = require('../app/api/engagement/stats/route.ts');

beforeEach(() => {
  session = { memberId: 'member-one' };
  rows = [{ total_likes: '4', total_saves: '2', total_views: '31', total_shares: '1', liked_content_ids: ['news-one'], saved_content_ids: [], recent_activity: [] }];
});

test('engagement stats maps the row returned by a Neon TABLE RPC', async () => {
  const response = await stats.GET(new NextRequest('http://localhost/api/engagement/stats'));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).stats, {
    totalLikes: 4, totalSaves: 2, totalViews: 31, totalShares: 1,
    likedContentIds: ['news-one'], savedContentIds: [], recentActivity: [],
  });
});

test('engagement stats returns the documented zero shape when a TABLE RPC is empty', async () => {
  rows = [];
  const response = await stats.GET(new NextRequest('http://localhost/api/engagement/stats'));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).stats, {
    totalLikes: 0, totalSaves: 0, totalViews: 0, totalShares: 0,
    likedContentIds: [], savedContentIds: [], recentActivity: [],
  });
});
