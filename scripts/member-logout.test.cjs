const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { createHash } = require('node:crypto');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);

let calls;
let databaseError;

require.cache[path.join(root, 'lib/auth/jwt.ts')] = {
  exports: { verifyMemberToken: async () => ({ memberId: 'member-one', email: 'member@example.invalid', role: 'member' }) },
};
require.cache[path.join(root, 'lib/supabase.ts')] = {
  exports: {
    supabaseAdmin: {
      from(table) {
        const operation = { table, action: null, filters: [], order: null, limit: null };
        calls.push(operation);
        const query = {
          select(columns) { operation.action = `select:${columns}`; return query; },
          update(values) { operation.action = 'update'; operation.values = values; return query; },
          eq(column, value) { operation.filters.push(['eq', column, value]); return query; },
          is(column, value) { operation.filters.push(['is', column, value]); return query; },
          order(column, options) { operation.order = [column, options]; return query; },
          limit(value) { operation.limit = value; return query; },
          then(resolve, reject) {
            if (databaseError) return Promise.reject(databaseError).then(resolve, reject);
            return Promise.resolve({ data: [{ ...operation.values, id: 'session-one' }], error: null }).then(resolve, reject);
          },
        };
        return query;
      },
    },
  },
};

const { NextRequest } = require('next/server');
const logout = require('../app/api/members/logout/route.ts');

function request() {
  return new NextRequest('http://localhost:2024/api/members/logout', {
    method: 'POST',
    headers: { cookie: 'member_token=signed-member-token' },
  });
}

beforeEach(() => {
  calls = [];
  databaseError = null;
});

test('logout deactivates only the session matching the current token digest', async () => {
  const response = await logout.POST(request());
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /member_token=;/);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    table: 'member_sessions',
    action: 'update',
    values: { is_active: false, last_activity_at: calls[0].values.last_activity_at },
    filters: [
      ['eq', 'member_id', 'member-one'],
      ['eq', 'token', createHash('sha256').update('signed-member-token').digest('hex')],
      ['eq', 'is_active', true],
    ],
    order: null,
    limit: null,
  });
  assert.equal(calls[0].values.is_active, false);
  assert.ok(calls[0].values.last_activity_at);
});

test('logout still clears the cookie when session persistence fails', async () => {
  databaseError = new Error('database unavailable');
  const response = await logout.POST(request());
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /member_token=;/);
  assert.equal(calls.length, 1);
});
