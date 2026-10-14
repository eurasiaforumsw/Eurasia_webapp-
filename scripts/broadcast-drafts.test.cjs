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

const actor = { email: 'admin@example.invalid', role: 'admin', memberId: '00000000-0000-4000-8000-000000000010' };
require.cache[path.join(root, 'app/api/broadcast/_auth.ts')] = { exports: {
  broadcastActor: async () => actor,
} };

let campaigns;
let content;
let databaseError;
let releases;

// Exercise the real query builder with a database substitute; never connect to PostgreSQL.
const pool = require('../lib/db.ts').default;
pool.connect = async () => ({
  async query(sql, values) {
    if (databaseError) throw databaseError;
    const placeholders = [...sql.matchAll(/\$(\d+)/g)].map((match) => Number(match[1]));
    assert.equal(Math.max(...placeholders), values.length, 'All bound parameters must be referenced');

    if (/^SELECT id FROM content WHERE id = \$1 LIMIT 1$/.test(sql)) {
      const rows = content.filter((row) => row.id === values[0]).map((row) => ({ id: row.id }));
      return { rows, rowCount: rows.length };
    }

    const insertion = sql.match(/^INSERT INTO email_campaigns \((.+)\) VALUES \((.+)\) RETURNING \*$/);
    if (insertion) {
      const columns = insertion[1].split(',');
      const bindings = insertion[2].split(',').map((binding) => {
        assert.match(binding, /^\$\d+$/);
        return values[Number(binding.slice(1)) - 1];
      });
      assert.equal(columns.length, bindings.length);
      const campaign = { id: createdId, ...Object.fromEntries(columns.map((column, index) => [column, bindings[index]])) };
      campaigns.push(campaign);
      return { rows: [{ ...campaign }], rowCount: 1 };
    }

    const update = sql.match(/^UPDATE email_campaigns SET (.+) WHERE (.+) RETURNING \*$/);
    const deletion = sql.match(/^DELETE FROM email_campaigns WHERE (.+) RETURNING (?:id|\*)$/);
    assert.ok(update || deletion, `Unexpected mutation: ${sql}`);
    const condition = update ? update[2] : deletion[1];
    const filters = condition.split(' AND ').map((part) => {
      const match = part.match(/^(\w+) = \$(\d+)$/);
      assert.ok(match, `Unexpected condition: ${part}`);
      return [match[1], values[Number(match[2]) - 1]];
    });
    const matching = campaigns.filter((row) => filters.every(([field, value]) => row[field] === value));
    if (update) {
      const fields = Object.fromEntries(update[1].split(', ').map((part) => {
        const match = part.match(/^(\w+) = \$(\d+)$/);
        assert.ok(match, `Unexpected assignment: ${part}`);
        return [match[1], values[Number(match[2]) - 1]];
      }));
      matching.forEach((row) => Object.assign(row, fields));
    } else {
      matching.forEach((row) => campaigns.splice(campaigns.indexOf(row), 1));
    }
    return { rows: matching.map((row) => ({ ...row })), rowCount: matching.length };
  },
  release() { releases++; },
});

const { NextRequest } = require('next/server');
const broadcast = require('../app/api/broadcast/route.ts');
const draftId = '00000000-0000-4000-8000-000000000001';
const sentId = '00000000-0000-4000-8000-000000000002';
const otherDraftId = '00000000-0000-4000-8000-000000000003';
const missingId = '00000000-0000-4000-8000-000000000099';
const createdId = '00000000-0000-4000-8000-000000000004';
const contentId = '00000000-0000-4000-8000-000000000020';
const fields = { title: 'Edited title', subject: 'Edited subject', body_html: '<p>Edited body</p>' };

function request(method, campaignId, extraFields = {}) {
  return new NextRequest('http://localhost:2024/api/broadcast', {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...(['POST', 'PATCH'].includes(method) ? fields : {}), campaignId, ...extraFields }),
  });
}

beforeEach(() => {
  campaigns = [
    { id: draftId, status: 'draft', title: 'Draft' },
    { id: sentId, status: 'sent', title: 'Sent' },
    { id: otherDraftId, status: 'draft', title: 'Other draft' },
  ];
  content = [{ id: contentId }];
  databaseError = null;
  releases = 0;
});

test('POST returns the persisted draft campaign with its creator', async () => {
  const response = await broadcast.POST(request('POST'));
  assert.equal(response.status, 201);
  const campaign = (await response.json()).campaign;
  assert.ok(campaign, 'The response must include the inserted campaign object');
  assert.equal(campaign.id, createdId);
  assert.equal(campaign.status, 'draft');
  assert.equal(campaign.title, fields.title);
  assert.equal(campaign.created_by, actor.memberId);
  assert.equal(campaign.created_by_actor, actor.email);
  assert.deepEqual(campaign, campaigns.find((row) => row.id === createdId));
  assert.equal(releases, 1);
});

test('POST verifies existing source content before creating a draft', async () => {
  const response = await broadcast.POST(request('POST', undefined, { content_id: contentId, content_kind: 'news' }));
  assert.equal(response.status, 201);
  const campaign = (await response.json()).campaign;
  assert.equal(campaign.content_id, contentId);
  assert.equal(campaign.content_kind, 'news');
  assert.equal(campaigns.length, 4);
  assert.equal(releases, 2);
});

test('POST rejects missing source content without inserting a campaign', async () => {
  const before = structuredClone(campaigns);
  const response = await broadcast.POST(request('POST', undefined, { content_id: missingId }));
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Source content not found' });
  assert.deepEqual(campaigns, before);
  assert.equal(releases, 1);
});

test('POST returns a JSON 500 without inserting when the database rejects the insert', async () => {
  const before = structuredClone(campaigns);
  databaseError = new Error('Mock database unavailable');
  const response = await broadcast.POST(request('POST'));
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Failed to create campaign' });
  assert.deepEqual(campaigns, before);
  assert.equal(releases, 1);
});

test('PATCH updates only the requested draft and returns the persisted campaign', async () => {
  const response = await broadcast.PATCH(request('PATCH', draftId));
  assert.equal(response.status, 200);
  const campaign = (await response.json()).campaign;
  assert.equal(campaign.id, draftId);
  assert.equal(campaign.status, 'draft');
  assert.equal(campaign.title, fields.title);
  assert.equal(campaign.subject, fields.subject);
  assert.equal(campaign.body_html, fields.body_html);
  assert.equal(campaigns.find((row) => row.id === draftId).title, fields.title);
  assert.equal(campaigns.find((row) => row.id === sentId).title, 'Sent');
  assert.equal(campaigns.find((row) => row.id === otherDraftId).title, 'Other draft');
  assert.equal(releases, 1);
});

test('PATCH returns a JSON 500 without modifying campaigns when source lookup fails', async () => {
  const before = structuredClone(campaigns);
  databaseError = new Error('Mock source lookup unavailable');
  const response = await broadcast.PATCH(request('PATCH', draftId, { content_id: contentId }));
  assert.equal(response.status, 500);
  assert.equal(typeof (await response.json()).error, 'string');
  assert.deepEqual(campaigns, before);
  assert.equal(releases, 1);
});

for (const [label, id] of [['sent', sentId], ['missing', missingId]]) {
  test(`PATCH returns 409 for a ${label} campaign and preserves existing rows`, async () => {
    const before = structuredClone(campaigns);
    const response = await broadcast.PATCH(request('PATCH', id));
    assert.equal(response.status, 409);
    assert.deepEqual(campaigns, before);
    assert.equal(releases, 1);
  });
}

test('DELETE removes only the requested draft', async () => {
  const response = await broadcast.DELETE(request('DELETE', draftId));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  assert.deepEqual(campaigns.map((row) => row.id), [sentId, otherDraftId]);
  assert.equal(releases, 1);
});

for (const [label, id] of [['sent', sentId], ['missing', missingId]]) {
  test(`DELETE returns 409 for a ${label} campaign and preserves existing rows`, async () => {
    const before = structuredClone(campaigns);
    const response = await broadcast.DELETE(request('DELETE', id));
    assert.equal(response.status, 409);
    assert.deepEqual(campaigns, before);
    assert.equal(releases, 1);
  });
}

for (const method of ['PATCH', 'DELETE']) {
  test(`${method} returns 500 and preserves rows when the database rejects the mutation`, async () => {
    const before = structuredClone(campaigns);
    databaseError = new Error('Mock database unavailable');
    const response = await broadcast[method](request(method, draftId));
    assert.equal(response.status, 500);
    assert.deepEqual(campaigns, before);
    assert.equal(releases, 1);
  });
}
