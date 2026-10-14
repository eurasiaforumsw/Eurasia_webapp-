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

let actor;
let campaigns;
let members;
let recipients;
let calls;
let releases;
let sendCalls;
let sendResponse;
let sendError;
let beforeQuery;
const campaignId = '00000000-0000-4000-8000-000000000001';
const otherCampaignId = '00000000-0000-4000-8000-000000000002';

require.cache[path.join(root, 'app/api/broadcast/_auth.ts')] = { exports: {
  broadcastActor: async () => actor,
} };
require.cache[path.join(root, 'lib/email.ts')] = { exports: {
  generateEmailTemplate: (html) => html,
  sendCampaignEmails: async (audience, subject, html, text) => {
    sendCalls.push({ audience, subject, html, text });
    if (sendError) throw sendError;
    return sendResponse || { results: audience.map(({ email }) => ({ email, emailId: `mock-${email}` })) };
  },
} };

function valueFor(expression, values) {
  if (/^\$\d+$/.test(expression)) return values[Number(expression.slice(1)) - 1];
  if (/^'.*'$/.test(expression)) return expression.slice(1, -1);
  if (expression === 'NULL') return null;
  if (expression === 'now()') return new Date().toISOString();
  assert.fail(`Unexpected SQL value: ${expression}`);
}

function matchingRows(table, conditions, values) {
  return table.filter((row) => conditions.split(' AND ').every((part) => {
    const match = part.match(/^(\w+) = (.+)$/);
    assert.ok(match, `Unexpected SQL condition: ${part}`);
    return row[match[1]] === valueFor(match[2], values);
  }));
}

// Run the actual Neon query builder against a fake PostgreSQL client.
// Email delivery is also mocked, so these tests never contact external services.
const pool = require('../lib/db.ts').default;
pool.connect = async () => ({
  async query(statement, values = []) {
    const sql = statement.trim().replace(/\s+/g, ' ');
    calls.push({ sql, values });
    const bindings = [...sql.matchAll(/\$(\d+)/g)].map((match) => Number(match[1]));
    assert.deepEqual([...new Set(bindings)].sort((a, b) => a - b), values.map((_, index) => index + 1), 'Every bound parameter must be referenced');
    if (beforeQuery) beforeQuery(sql, values);

    if (sql === 'SELECT * FROM email_campaigns WHERE id = $1 LIMIT 1') {
      const row = campaigns.find((item) => item.id === values[0]);
      return { rows: row ? [{ ...row }] : [], rowCount: row ? 1 : 0 };
    }

    // Also support the previous RPC to verify its false-return regression.
    if (/^SELECT \* FROM claim_email_campaign\(/.test(sql)) {
      const row = campaigns.find((item) => item.id === values[0] && item.status === 'draft');
      if (row) row.status = 'sending';
      return { rows: [{ claim_email_campaign: Boolean(row) }], rowCount: 1 };
    }

    const memberQuery = sql.match(/^SELECT id, email, full_name FROM members WHERE (.+) ORDER BY id LIMIT 500 OFFSET (\$\d+)$/);
    if (memberQuery) {
      const matching = members.filter((row) => memberQuery[1].split(' AND ').every((part) => {
        const status = part.match(/^status = ANY\((\$\d+)\)$/);
        if (status) return valueFor(status[1], values).includes(row.status);
        const audience = part.match(/^membership_type = (\$\d+)$/);
        if (audience) return row.membership_type === valueFor(audience[1], values);
        const groups = part.match(/^target_groups && (\$\d+)$/);
        assert.ok(groups, `Unexpected member filter: ${part}`);
        return row.target_groups.some((group) => valueFor(groups[1], values).includes(group));
      })).sort((a, b) => a.id.localeCompare(b.id));
      const offset = valueFor(memberQuery[2], values);
      const rows = matching.slice(offset, offset + 500).map(({ id, email, full_name }) => ({ id, email, full_name }));
      return { rows, rowCount: rows.length };
    }

    const insertion = sql.match(/^INSERT INTO campaign_recipients \((.+)\) VALUES (.+) RETURNING \*$/);
    if (insertion) {
      const columns = insertion[1].split(',');
      const rows = [...insertion[2].matchAll(/\(([^)]+)\)/g)].map((match) =>
        Object.fromEntries(match[1].split(',').map((expression, index) => [columns[index], valueFor(expression, values)])));
      for (const row of rows) {
        assert.ok(!recipients.some((item) => item.campaign_id === row.campaign_id && item.member_id === row.member_id), 'Recipient must be unique within its campaign');
      }
      recipients.push(...rows);
      return { rows: rows.map((row) => ({ ...row })), rowCount: rows.length };
    }

    const update = sql.match(/^UPDATE (email_campaigns|campaign_recipients) SET (.+) WHERE (.+) RETURNING \*$/);
    if (update) {
      const table = update[1] === 'email_campaigns' ? campaigns : recipients;
      const rows = matchingRows(table, update[3], values);
      const changes = Object.fromEntries(update[2].split(', ').map((part) => {
        const match = part.match(/^(\w+) = (.+)$/);
        assert.ok(match, `Unexpected SQL assignment: ${part}`);
        return [match[1], valueFor(match[2], values)];
      }));
      rows.forEach((row) => Object.assign(row, changes));
      return { rows: rows.map((row) => ({ ...row })), rowCount: rows.length };
    }

    const deletion = sql.match(/^DELETE FROM campaign_recipients WHERE (.+) RETURNING \*$/);
    assert.ok(deletion, `Unexpected SQL: ${sql}`);
    const rows = matchingRows(recipients, deletion[1], values);
    rows.forEach((row) => recipients.splice(recipients.indexOf(row), 1));
    return { rows: rows.map((row) => ({ ...row })), rowCount: rows.length };
  },
  release() { releases++; },
});

const { NextRequest } = require('next/server');
const { POST } = require('../app/api/broadcast/send/route.ts');
function request(id = campaignId) {
  return new NextRequest('http://localhost:2024/api/broadcast/send', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ campaignId: id }),
  });
}
function member(id, extra = {}) {
  return { id, email: `${id}@example.invalid`, full_name: id, status: 'active', membership_type: 'professional', target_groups: ['Clinical Practice'], ...extra };
}

beforeEach(() => {
  process.env.RESEND_API_KEY = 'mock-test-key';
  actor = { email: 'admin@example.invalid', role: 'admin' };
  campaigns = [{ id: campaignId, status: 'draft', subject: 'Research update', body_html: '<p>Update</p>', audience: 'all', target_statuses: ['active'], target_groups: [] }];
  members = [member('m1')];
  recipients = [];
  calls = [];
  releases = 0;
  sendCalls = [];
  sendResponse = null;
  sendError = null;
  beforeQuery = null;
});

test('sends once to matching, deduplicated recipients and preserves other campaigns', async () => {
  Object.assign(campaigns[0], { audience: 'professional', target_groups: ['Clinical Practice'], body_text: 'Update' });
  members = [member('m1'), member('m2', { membership_type: 'student' }), member('m3', { status: 'pending' }),
    member('m4', { target_groups: ['Education'] }), member('m5', { email: 'M1@EXAMPLE.INVALID' }), member('m6', { email: ' ' })];
  recipients.push({ campaign_id: otherCampaignId, member_id: 'm1', status: 'pending' });
  const response = await POST(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, totalRecipients: 1, totalSent: 1, totalFailed: 0 });
  assert.deepEqual(sendCalls, [{ audience: [{ email: 'm1@example.invalid', name: 'm1' }], subject: 'Research update', html: '<p>Update</p>', text: 'Update' }]);
  assert.equal(campaigns[0].status, 'sent');
  assert.equal(campaigns[0].recipient_count, 1);
  assert.equal(recipients[0].status, 'pending');
  assert.equal(recipients[1].status, 'sent');
  assert.equal(recipients[1].resend_email_id, 'mock-m1@example.invalid');
  assert.ok(recipients[1].sent_at);
  assert.equal(releases, calls.length);
  assert.equal((await POST(request())).status, 409);
  assert.equal(sendCalls.length, 1);
});

test('partial delivery records per-recipient failures and cannot be resent', async () => {
  members.push(member('m2'), member('m3'));
  sendResponse = { results: [{ email: members[0].email, emailId: 'mock-success' }, { email: members[1].email, error: 'Rejected' }] };
  const response = await POST(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: false, totalRecipients: 3, totalSent: 1, totalFailed: 2 });
  assert.deepEqual(recipients.map((row) => row.status), ['sent', 'failed', 'failed']);
  assert.equal(recipients[1].error_message, 'Rejected');
  assert.equal(recipients[2].error_message, 'Delivery service returned no result');
  assert.equal(campaigns[0].status, 'failed');
  assert.equal((await POST(request())).status, 409);
  assert.equal(sendCalls.length, 1);
});

test('concurrent requests claim the draft only once', async () => {
  const responses = await Promise.all([POST(request()), POST(request())]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
  assert.equal(sendCalls.length, 1);
  assert.equal(recipients.length, 1);
  assert.equal(campaigns[0].status, 'sent');
});

test('uses content and audience returned by the claim when a draft changes after loading', async () => {
  beforeQuery = (sql) => {
    if (sql.startsWith('UPDATE email_campaigns SET status = \'sending\'')) {
      Object.assign(campaigns[0], { subject: 'Latest subject', body_html: '<p>Latest body</p>', audience: 'student' });
    }
  };
  members.push(member('m2', { membership_type: 'student' }));
  assert.equal((await POST(request())).status, 200);
  assert.equal(sendCalls[0].subject, 'Latest subject');
  assert.equal(sendCalls[0].html, '<p>Latest body</p>');
  assert.deepEqual(sendCalls[0].audience.map((row) => row.email), ['m2@example.invalid']);
});

test('an empty audience restores the draft without sending', async () => {
  members = [];
  const response = await POST(request());
  assert.equal(response.status, 400);
  assert.equal(campaigns[0].status, 'draft');
  assert.equal(campaigns[0].recipient_count, 0);
  assert.equal(sendCalls.length, 0);
});

test('paginates recipients and persists batches of at most 500', async () => {
  members = Array.from({ length: 501 }, (_, index) => member(`m${String(index).padStart(4, '0')}`));
  const response = await POST(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).totalSent, 501);
  assert.equal(recipients.length, 501);
  assert.deepEqual(calls.filter(({ sql }) => sql.startsWith('SELECT id, email')).map(({ values }) => values.at(-1)), [0, 500]);
  assert.deepEqual(calls.filter(({ sql }) => sql.startsWith('INSERT INTO campaign_recipients')).map(({ values }) => values.length / 5), [500, 1]);
});

for (const phase of ['load', 'claim']) {
  test(`a ${phase} database failure returns JSON 500 before email delivery`, async () => {
    beforeQuery = (sql) => {
      if ((phase === 'load' && sql.startsWith('SELECT * FROM email_campaigns')) ||
          (phase === 'claim' && (sql.startsWith('UPDATE email_campaigns SET status = \'sending\'') || sql.includes('claim_email_campaign')))) {
        throw new Error(`Mock ${phase} failure`);
      }
    };
    const response = await POST(request());
    assert.equal(response.status, 500);
    assert.equal(typeof (await response.json()).error, 'string');
    assert.equal(campaigns[0].status, 'draft');
    assert.equal(sendCalls.length, 0);
    assert.equal(releases, calls.length);
  });
}

for (const phase of ['insert', 'count']) {
  test(`a ${phase} failure before delivery clears staged recipients and restores the draft`, async () => {
    beforeQuery = (sql) => {
      if ((phase === 'insert' && sql.startsWith('INSERT INTO campaign_recipients')) ||
          (phase === 'count' && sql.startsWith('UPDATE email_campaigns SET recipient_count'))) throw new Error('Mock staging failure');
    };
    const response = await POST(request());
    assert.equal(response.status, 500);
    assert.equal(campaigns[0].status, 'draft');
    assert.equal(recipients.length, 0);
    assert.equal(sendCalls.length, 0);
  });
}

test('cleanup failure returns JSON 500 and keeps the campaign failed', async () => {
  beforeQuery = (sql) => {
    if (sql.startsWith('UPDATE email_campaigns SET recipient_count') || sql.startsWith('DELETE FROM campaign_recipients')) throw new Error('Mock cleanup failure');
  };
  const response = await POST(request());
  assert.equal(response.status, 500);
  assert.equal(typeof (await response.json()).error, 'string');
  assert.equal(campaigns[0].status, 'failed');
  assert.equal(recipients.length, 1);
  assert.equal((await POST(request())).status, 409);
  assert.equal(sendCalls.length, 0);
});

test('failure to persist recovery still returns JSON 500', async () => {
  beforeQuery = (sql) => {
    if (sql.startsWith('UPDATE email_campaigns SET recipient_count') || sql.startsWith('UPDATE email_campaigns SET status = $')) throw new Error('Mock recovery failure');
  };
  const response = await POST(request());
  assert.equal(response.status, 500);
  assert.equal(typeof (await response.json()).error, 'string');
  assert.equal(campaigns[0].status, 'sending');
  assert.equal(sendCalls.length, 0);
});

test('provider failure preserves staged recipients and prevents automatic retry', async () => {
  sendError = new Error('Mock provider interrupted');
  const response = await POST(request());
  assert.equal(response.status, 500);
  assert.equal(campaigns[0].status, 'failed');
  assert.equal(recipients.length, 1);
  assert.equal(calls.some(({ sql }) => sql.startsWith('DELETE')), false);
  assert.equal((await POST(request())).status, 409);
  assert.equal(sendCalls.length, 1);
});

test('failure to persist a delivery result never resets the campaign to draft', async () => {
  beforeQuery = (sql) => {
    if (sql.startsWith('UPDATE campaign_recipients')) throw new Error('Mock tracking failure');
  };
  const response = await POST(request());
  assert.equal(response.status, 500);
  assert.equal(campaigns[0].status, 'failed');
  assert.equal(recipients.length, 1);
  assert.equal(calls.some(({ sql }) => sql.startsWith('DELETE')), false);
  assert.equal((await POST(request())).status, 409);
  assert.equal(sendCalls.length, 1);
});

test('authorization, input and email configuration are checked before database access', async () => {
  actor = null;
  assert.equal((await POST(request())).status, 401);
  actor = { email: 'admin@example.invalid', role: 'admin' };
  assert.equal((await POST(request('invalid'))).status, 400);
  delete process.env.RESEND_API_KEY;
  assert.equal((await POST(request())).status, 503);
  assert.equal(calls.length, 0);
  assert.equal(sendCalls.length, 0);
});

test('missing and non-draft campaigns are rejected without sending', async () => {
  assert.equal((await POST(request(otherCampaignId))).status, 404);
  campaigns[0].status = 'sent';
  assert.equal((await POST(request())).status, 409);
  assert.equal(sendCalls.length, 0);
});
