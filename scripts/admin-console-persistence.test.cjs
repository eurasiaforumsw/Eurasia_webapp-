const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
process.env.RESEND_API_KEY = 'mock-test-key';

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

const tables = new Map();
let nextId = 1;
const getTable = (name) => {
  if (!tables.has(name)) tables.set(name, []);
  return tables.get(name);
};
const db = {
  from(name) {
    let action = 'select';
    let value;
    let limit = Infinity;
    let start = 0;
    let end = Infinity;
    const filters = [];
    const matches = (row) => filters.every((filter) => filter(row));
    const run = (single = false) => {
      const table = getTable(name);
      let matching = table.filter(matches);
      if (action === 'insert') {
        const input = Array.isArray(value) ? value : [value];
        matching = input.map((item) => ({
          id: item.id || `00000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`,
          created_at: new Date().toISOString(),
          read_at: new Date().toISOString(),
          ...item,
        }));
        table.push(...matching);
      } else if (action === 'upsert') {
        const index = table.findIndex((row) => row.id === value.id);
        const row = index < 0 ? { read_at: new Date().toISOString(), ...value } : { ...table[index], ...value };
        if (index < 0) table.push(row); else table[index] = row;
        matching = [row];
      } else if (action === 'update') {
        matching.forEach((row) => Object.assign(row, value));
      } else if (action === 'delete') {
        matching.forEach((row) => table.splice(table.indexOf(row), 1));
      }
      if (action === 'select') matching = matching.slice(start, end + 1).slice(0, limit);
      const scalar = single || (['insert', 'upsert'].includes(action) && !Array.isArray(value));
      return { data: scalar ? matching[0] || null : matching, error: null, count: matching.length };
    };
    const query = {
      select() { return query; },
      eq(field, val) { filters.push((row) => row[field] === val); return query; },
      in(field, vals) { filters.push((row) => vals.includes(row[field])); return query; },
      contains(field, vals) { filters.push((row) => vals.every((val) => row[field]?.includes(val))); return query; },
      overlaps(field, vals) { filters.push((row) => row[field]?.some((val) => vals.includes(val))); return query; },
      gt(field, val) { filters.push((row) => row[field] > val); return query; },
      order() { return query; },
      limit(val) { limit = val; return query; },
      range(from, to) { start = from; end = to; return query; },
      offset(value) { start = value; return query; },
      execute() { return Promise.resolve(run()); },
      match(values) { Object.entries(values).forEach(([field, val]) => query.eq(field, val)); return query; },
      where(fragment) {
        assert.match(fragment.text, /recipient_ids @> ARRAY/);
        filters.push((row) => row.recipient_ids?.includes(fragment.values[0]));
        return query;
      },
      insert(input) { action = 'insert'; value = input; return query; },
      upsert(input) { action = 'upsert'; value = input; return query; },
      update(input) { action = 'update'; value = input; return query; },
      delete() { action = 'delete'; return query; },
      maybeSingle() { return Promise.resolve(run(true)); },
      single() { return Promise.resolve(run(true)); },
      then(resolve, reject) { return Promise.resolve(run()).then(resolve, reject); },
    };
    return query;
  },
  async rpc(name, params) {
    if (name === 'edit_admin_announcement') {
      const announcement = getTable('admin_announcements').find((row) => row.id === params.p_id);
      if (!announcement) return { data: false, error: null };
      Object.assign(announcement, {
        subject: params.p_subject, body: params.p_body,
        recipient_type: params.p_recipient_type, recipient_ids: params.p_recipient_ids,
      });
      const reads = getTable('admin_announcement_reads');
      for (let index = reads.length - 1; index >= 0; index--) {
        if (reads[index].announcement_id === params.p_id) reads.splice(index, 1);
      }
      return { data: true, error: null };
    }
    assert.equal(name, 'claim_email_campaign');
    const campaign = getTable('email_campaigns').find((row) => row.id === params.p_campaign_id);
    if (!campaign || campaign.status !== 'draft') return { data: false, error: null };
    campaign.status = 'sending';
    return { data: true, error: null };
  },
};
let actor = { id: 'admin@efsw.local', email: 'admin@efsw.local', role: 'super-admin' };
let sendCalls = 0;
let sendResponse = null;
require.cache[path.join(root, 'lib/supabase.ts')] = { exports: { supabaseAdmin: db } };
const sqlTag = (parts, ...values) => ({ text: parts.reduce((text, part, index) => text + part + (index < values.length ? `$${index + 1}` : ''), ''), values });
async function rawQuery(statement, values = []) {
  const sql = statement.trim().replace(/\s+/g, ' ');
  if (sql.startsWith("UPDATE email_campaigns SET status = 'sending'")) {
    const row = getTable('email_campaigns').find((row) => row.id === values[0] && row.status === 'draft');
    if (row) row.status = 'sending';
    return { rows: row ? [{ ...row }] : [], rowCount: row ? 1 : 0 };
  }
  const audience = sql.match(/^SELECT (id, email, full_name|COUNT\(\*\) as count) FROM members WHERE (.+?)(?: ORDER BY id LIMIT 500 OFFSET (\$\d+))?$/);
  if (audience) {
    const matching = getTable('members').filter((row) => audience[2].split(' AND ').every((condition) => {
      const status = condition.match(/^status = ANY\((\$\d+)\)$/);
      if (status) return values[Number(status[1].slice(1)) - 1].includes(row.status);
      const kind = condition.match(/^membership_type = (\$\d+)$/);
      if (kind) return row.membership_type === values[Number(kind[1].slice(1)) - 1];
      const groups = condition.match(/^target_groups && (\$\d+)$/);
      assert.ok(groups, `Unexpected audience filter ${condition}`);
      return row.target_groups?.some((group) => values[Number(groups[1].slice(1)) - 1].includes(group));
    }));
    if (audience[1].startsWith('COUNT')) return { rows: [{ count: String(matching.length) }], rowCount: 1 };
    const offset = audience[3] ? values[Number(audience[3].slice(1)) - 1] : 0;
    const rows = matching.sort((a, b) => a.id.localeCompare(b.id)).slice(offset, offset + 500);
    return { rows, rowCount: rows.length };
  }
  const deletion = sql.match(/^DELETE FROM email_campaigns WHERE id = \$1 AND status = \$2 RETURNING id$/);
  if (deletion) {
    const row = getTable('email_campaigns').find((row) => row.id === values[0] && row.status === values[1]);
    if (row) getTable('email_campaigns').splice(getTable('email_campaigns').indexOf(row), 1);
    return { rows: row ? [{ id: row.id }] : [], rowCount: row ? 1 : 0 };
  }
  assert.fail(`Unexpected raw query ${sql}`);
}
require.cache[path.join(root, 'lib/db.ts')] = { exports: { db, sql: sqlTag, query: rawQuery } };

require.cache[path.join(root, 'lib/auth/session.ts')] = { exports: {
  verifyRequestSession: async () => actor,
  CONTENT_ROLES: ['super-admin', 'admin', 'pr', 'content-editor'],
  CONSOLE_ROLES: ['super-admin', 'admin', 'pr', 'content-editor', 'member-reviewer'],
} };
require.cache[path.join(root, 'lib/email.ts')] = { exports: {
  generateEmailTemplate: (html) => html,
  sendCampaignEmails: async (recipients) => {
    sendCalls++;
    return sendResponse || { results: recipients.map(({ email }) => ({ email, emailId: `mock-${email}` })), totalSent: recipients.length, totalFailed: 0 };
  },
} };

const { NextRequest } = require('next/server');
const broadcast = require('../app/api/broadcast/route.ts');
const send = require('../app/api/broadcast/send/route.ts');
const recipientCount = require('../app/api/broadcast/recipients/route.ts');
const announcements = require('../app/api/announcements/route.ts');
const categories = require('../app/api/admin/categories/route.ts');
const activity = require('../app/api/admin/activity/route.ts');

function req(pathname, method = 'GET', body) {
  return new NextRequest(`http://localhost:2024${pathname}`, {
    method, ...(body ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
}
function reset() {
  tables.clear(); nextId = 1; sendCalls = 0; sendResponse = null;
  actor = { id: 'admin@efsw.local', email: 'admin@efsw.local', role: 'super-admin' };
}

test('broadcast draft persists legacy admin actor and sends once to matching members', async () => {
  reset();
  getTable('members').push(
    { id: 'm1', email: 'one@example.invalid', full_name: 'One', status: 'active', membership_type: 'professional', target_groups: ['Clinical Practice'] },
    { id: 'm2', email: 'two@example.invalid', full_name: 'Two', status: 'active', membership_type: 'student', target_groups: ['Clinical Practice'] },
  );
  const input = { title: 'Research', subject: 'Research update', body_html: '<p>Update</p>', content_kind: 'academic', audience: 'professional', target_groups: ['Clinical Practice'], target_statuses: ['active'] };
  const created = await broadcast.POST(req('/api/broadcast', 'POST', input));
  assert.equal(created.status, 201);
  const campaign = (await created.json()).campaign;
  assert.equal(campaign.created_by, null);
  assert.equal(campaign.created_by_actor, 'admin@efsw.local');
  assert.equal(campaign.status, 'draft');
  const sent = await send.POST(req('/api/broadcast/send', 'POST', { campaignId: campaign.id }));
  assert.equal(sent.status, 200);
  assert.equal((await sent.json()).totalSent, 1);
  assert.equal(sendCalls, 1);
  assert.equal(getTable('campaign_recipients').length, 1);
  assert.equal(getTable('campaign_recipients')[0].member_id, 'm1');
  assert.equal(getTable('email_campaigns')[0].status, 'sent');
  assert.equal((await send.POST(req('/api/broadcast/send', 'POST', { campaignId: campaign.id }))).status, 409);
  assert.equal(sendCalls, 1);
});

test('broadcast send records partial delivery and cannot silently retry successful recipients', async () => {
  reset();
  getTable('members').push(
    { id: 'm1', email: 'one@example.invalid', full_name: 'One', status: 'active', membership_type: 'professional', target_groups: [] },
    { id: 'm2', email: 'two@example.invalid', full_name: 'Two', status: 'active', membership_type: 'professional', target_groups: [] },
  );
  getTable('email_campaigns').push({ id: '00000000-0000-4000-8000-000000000099', status: 'draft', subject: 'Test', body_html: '<p>Test</p>', target_statuses: ['active'], target_groups: [], audience: 'all' });
  sendResponse = { results: [{ email: 'one@example.invalid', emailId: 'mock-one' }, { email: 'two@example.invalid', error: 'Mock provider rejected' }], totalSent: 1, totalFailed: 1 };
  const result = await send.POST(req('/api/broadcast/send', 'POST', { campaignId: '00000000-0000-4000-8000-000000000099' }));
  assert.equal(result.status, 200);
  assert.deepEqual(getTable('campaign_recipients').map((row) => row.status), ['sent', 'failed']);
  assert.equal(getTable('email_campaigns')[0].status, 'failed');
  assert.equal((await send.POST(req('/api/broadcast/send', 'POST', { campaignId: '00000000-0000-4000-8000-000000000099' }))).status, 409);
  assert.equal(sendCalls, 1);
});

test('broadcast recipient estimate reads the database for a PR without member roster access', async () => {
  reset();
  actor = { id: 'pr@example.invalid', email: 'pr@example.invalid', role: 'pr' };
  getTable('members').push(
    { id: 'm1', email: 'one@example.invalid', status: 'active', membership_type: 'professional', target_groups: ['Clinical Practice'] },
    { id: 'm2', email: 'two@example.invalid', status: 'active', membership_type: 'student', target_groups: ['Clinical Practice'] },
  );
  const response = await recipientCount.POST(req('/api/broadcast/recipients', 'POST', {
    audience: 'professional', targetGroups: ['Clinical Practice'], targetStatuses: ['active'],
  }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).count, 1);
  assert.equal(sendCalls, 0);
});

test('announcements expose all and targeted messages only to eligible member and persist read receipt', async () => {
  reset();
  getTable('members').push({ id: 'm1' }, { id: 'm2' });
  const all = await announcements.POST(req('/api/announcements', 'POST', { subject: 'All', body: 'Hello', recipientType: 'all' }));
  assert.equal(all.status, 201);
  const personal = await announcements.POST(req('/api/announcements', 'POST', { subject: 'Private', body: 'For one', recipientType: 'individual', recipientIds: ['m1'] }));
  assert.equal(personal.status, 201);
  const personalId = (await personal.json()).announcement.id;
  actor = { id: 'm2', memberId: 'm2', email: 'two@example.invalid', role: 'member' };
  let visible = await announcements.GET(req('/api/announcements'));
  assert.deepEqual((await visible.json()).announcements.map((item) => item.subject), ['All']);
  assert.equal((await announcements.PATCH(req('/api/announcements', 'PATCH', { announcementId: personalId, read: true }))).status, 404);
  actor = { id: 'm1', memberId: 'm1', email: 'one@example.invalid', role: 'member' };
  visible = await announcements.GET(req('/api/announcements'));
  assert.equal((await visible.json()).announcements.length, 2);
  assert.equal((await announcements.PATCH(req('/api/announcements', 'PATCH', { announcementId: personalId, read: true }))).status, 200);
  assert.equal(getTable('admin_announcement_reads')[0].member_id, 'm1');
  actor = { id: 'admin@efsw.local', email: 'admin@efsw.local', role: 'super-admin' };
  const edited = await announcements.PATCH(req('/api/announcements', 'PATCH', {
    announcementId: personalId, subject: 'Retargeted', body: 'For two', recipientType: 'individual', recipientIds: ['m2'],
  }));
  assert.equal(edited.status, 200);
  assert.deepEqual(getTable('admin_announcements').find((row) => row.id === personalId).recipient_ids, ['m2']);
  assert.equal(getTable('admin_announcement_reads').length, 0);
  actor = { id: 'm1', memberId: 'm1', email: 'one@example.invalid', role: 'member' };
  visible = await announcements.GET(req('/api/announcements'));
  assert.deepEqual((await visible.json()).announcements.map((item) => item.subject), ['All']);
  actor = { id: 'm2', memberId: 'm2', email: 'two@example.invalid', role: 'member' };
  visible = await announcements.GET(req('/api/announcements'));
  assert.deepEqual((await visible.json()).announcements.map((item) => item.subject).sort(), ['All', 'Retargeted']);
  assert.equal((await announcements.POST(req('/api/announcements', 'POST', { subject: 'No', body: 'No', recipientType: 'all' }))).status, 403);
  actor = { id: 'm2', memberId: 'm2', email: 'pr@example.invalid', role: 'pr' };
  visible = await announcements.GET(req('/api/announcements?inbox=true'));
  assert.deepEqual((await visible.json()).announcements.map((item) => item.subject).sort(), ['All', 'Retargeted']);
  assert.equal((await announcements.PATCH(req('/api/announcements', 'PATCH', { announcementId: personalId, read: true }))).status, 200);
});

test('categories persist an atomic array and activity tracks actor and time', async () => {
  reset();
  const saved = await categories.PUT(req('/api/admin/categories', 'PUT', { categories: [{ id: 'research', kind: 'academic', label: 'Research', order: 0, enabled: true }] }));
  assert.equal(saved.status, 200);
  assert.equal((await categories.GET(req('/api/admin/categories'))).status, 200);
  assert.equal(getTable('admin_categories')[0].categories[0].label, 'Research');
  const logged = await activity.POST(req('/api/admin/activity', 'POST', { action: 'saved categories', detail: 'Research', tone: 'success' }));
  assert.equal(logged.status, 201);
  assert.equal(getTable('admin_activity')[0].actor_email, 'admin@efsw.local');
  actor = { id: 'm1', memberId: 'm1', email: 'member@example.invalid', role: 'member' };
  assert.equal((await categories.PUT(req('/api/admin/categories', 'PUT', { categories: [] }))).status, 401);
  assert.equal((await activity.GET(req('/api/admin/activity'))).status, 401);
});
