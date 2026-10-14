const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
const { db, query, sql, default: pool } = require('../lib/db.ts');
let calls, rows, releases;
pool.connect = async () => ({
  query: async (text, params = []) => {
    calls.push({ text, params });
    return { rows, rowCount: rows.length };
  },
  release: () => releases++,
});
beforeEach(() => { calls = []; rows = [{ id: 'one' }]; releases = 0; });

test('member and content filters both constrain reads', async () => {
  await db.from('content_likes').select('id').eq('member_id', 'member').eq('content_id', 'content');
  assert.match(calls[0].text, /WHERE member_id = \$1 AND content_id = \$2/);
  assert.deepEqual(calls[0].params, ['member', 'content']);
});
test('chained update executes once with all constraints and selected response', async () => {
  const pending = db.from('content').update({ title: 'new' }).eq('id', 'one').eq('status', 'draft').select('id, title');
  assert.equal(calls.length, 0);
  const result = await pending.single();
  assert.deepEqual(result.data, { id: 'one' });
  assert.match(calls[0].text, /WHERE id = \$2 AND status = \$3 RETURNING id, title/);
  assert.deepEqual(calls[0].params, ['new', 'one', 'draft']);
});
test('update raw conditions shift bindings past SET values', async () => {
  await db.from('email_campaigns').update({ subject: 'new' }).where('id = $1 AND status = $2', 'one', 'draft').select('*');
  assert.match(calls[0].text, /id = \$2 AND status = \$3/);
  assert.deepEqual(calls[0].params, ['new', 'one', 'draft']);
});
test('delete supports bulk filters while preserving ownership filter', async () => {
  await db.from('content_likes').delete().eq('member_id', 'member').in('id', ['one', 'two']).select('id');
  assert.match(calls[0].text, /WHERE member_id = \$1 AND id IN \(\$2,\$3\) RETURNING id/);
  assert.deepEqual(calls[0].params, ['member', 'one', 'two']);
});
test('empty IN never generates invalid or unbounded SQL', async () => {
  await db.from('members').delete().in('id', []).select('id');
  assert.match(calls[0].text, /WHERE FALSE/);
});
test('upsert is awaitable and binds conflict identifiers', async () => {
  const result = await db.from('admin_announcement_reads').upsert({ announcement_id: 'one', member_id: 'two' }, {
    onConflict: 'announcement_id,member_id', ignoreDuplicates: true,
  });
  assert.equal(calls.length, 1);
  assert.equal(result.data.id, 'one');
  assert.match(calls[0].text, /ON CONFLICT \(announcement_id,member_id\) DO NOTHING/);
});
test('insert supports selected single response', async () => {
  const result = await db.from('content').insert({ id: 'one' }).select('id').single();
  assert.equal(result.data.id, 'one');
});
test('count HEAD returns filtered numeric total without fetching row data', async () => {
  rows = [{ count: '17' }];
  const result = await db.from('messages').select('*', { count: 'exact', head: true }).eq('conversation_id', 'one').neq('sender_id', 'self');
  assert.equal(result.count, 17);
  assert.equal(result.data, null);
  assert.equal(calls.length, 1);
  assert.match(calls[0].text, /COUNT\(\*\).*WHERE conversation_id = \$1 AND sender_id != \$2/i);
});
test('multiple order clauses and NULL ordering are preserved', async () => {
  await db.from('conversations').select('*').order('last_message_at', { ascending: false, nullsFirst: false }).order('id').range(20, 29);
  assert.match(calls[0].text, /ORDER BY last_message_at DESC NULLS LAST, id ASC LIMIT 10 OFFSET 20/);
});
test('raw OR fragment stays grouped with identity and status filters', async () => {
  await db.from('members').select('id').neq('id', 'self').where(sql`full_name ILIKE ${'%name%'} OR email ILIKE ${'%name%'}`).eq('status', 'active');
  assert.match(calls[0].text, /WHERE id != \$1 AND \(full_name ILIKE \$2 OR email ILIKE \$3\) AND status = \$4/);
});
test('scalar RPC keeps false and zero values', async () => {
  rows = [{ claim_email_campaign: false }];
  assert.equal((await db.rpc('claim_email_campaign', { p_campaign_id: 'one' })).data, false);
  rows = [{ get_count: 0 }];
  assert.equal((await db.rpc('get_count')).data, 0);
});
test('table RPC preserves all rows, including empty and single-row results', async () => {
  rows = [
    { is_suspended: true, suspension_type: 'permanent' },
    { is_suspended: false, suspension_type: null },
  ];
  assert.deepEqual((await db.rpc('is_member_suspended', { p_member_id: 'one' })).data, rows);
  rows = [{ total_likes: '4', total_saves: '2' }];
  assert.deepEqual((await db.rpc('get_member_engagement_stats', { p_member_id: 'one' })).data, rows);
  rows = [];
  assert.deepEqual((await db.rpc('get_member_engagement_stats', { p_member_id: 'one' })).data, []);
});
test('query serializes timestamps and releases clients', async () => {
  rows = [{ created_at: new Date('2026-01-02T03:04:05Z'), nested: { dates: [new Date('2026-01-01T00:00:00Z')] } }];
  const result = await query('SELECT NOW()');
  assert.equal(result.rows[0].created_at, '2026-01-02T03:04:05.000Z');
  assert.equal(result.rows[0].nested.dates[0], '2026-01-01T00:00:00.000Z');
  assert.equal(releases, 1);
});
test('JSON arrays and native PostgreSQL arrays use their correct encodings', async () => {
  await db.from('admin_categories').upsert({ id: 'default', categories: ['News'] }, { onConflict: 'id' });
  assert.equal(calls[0].params[1], '["News"]');
  await db.from('content').insert({ id: 'one', target_groups: ['Clinical'] });
  assert.deepEqual(calls[1].params[1], ['Clinical']);
});
test('mutation without a constraint and invalid structural identifiers are rejected', async () => {
  await assert.rejects(async () => await db.from('members').update({ status: 'active' }), /condition/i);
  await assert.rejects(async () => await db.from('members; DROP TABLE members').select('*'), /identifier/i);
});
