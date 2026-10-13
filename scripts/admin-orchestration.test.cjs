const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
const load = Module._load;
let harness;
let role;
let loaded;
let failStatus;
let failDelete;
let failSave;
let storedMembers;
const stubs = new Map();
const member = { id: 'one', fullName: 'Reader One', email: 'one@example.invalid', status: 'pending', country: 'TH', membershipType: 'professional', joinedAt: '2026-10-01', reviewNote: '' };
const defaultLayout = { deanProfiles: [] };
let cachedContent = [];
const data = {
  defaultLayoutConfig: defaultLayout, getAdminSettings: () => ({}), getAdminLayout: () => defaultLayout,
  getAdminContentCategories: () => [],
  isContentExpired: () => false, isContentVisible: () => true,
  getAdminContent: () => cachedContent,
  saveAdminContent: (item) => { cachedContent = cachedContent.map((row) => row.id === item.id ? item : row); },
  deleteAdminContent: (id) => { cachedContent = cachedContent.filter((row) => row.id !== id); },
  syncAdminContent: async () => { loaded.push('content'); return [{ id: 'paper', title: 'Paper', kind: 'academic', status: 'draft' }]; },
  syncAdminLayout: async () => { loaded.push('layout'); return defaultLayout; },
  syncAdminSettings: async () => { loaded.push('settings'); return {}; },
  saveAdminContentRemote: async () => { if (failSave) throw new Error('Save rejected'); return [{ id: 'paper', title: 'Saved' }]; },
  deleteAdminContentRemote: async () => { if (failDelete) throw new Error('Delete rejected'); return []; },
  saveAdminLayoutRemote: async (layout) => layout, saveAdminSettingsRemote: async () => {},
};
const adminMembers = {
  fetchAdminMembers: async () => { loaded.push('members'); return storedMembers; },
  updateAdminMemberStatus: async (id, status, reviewNote) => {
    if (failStatus) throw new Error('Status rejected');
    return { ...storedMembers.find((row) => row.id === id), status, reviewNote };
  },
  deleteAdminMemberRemote: async () => { if (failDelete) throw new Error('Delete rejected'); },
  executeMemberBulk: async (_action, ids) => ids.map((id) => ({ id, success: true })),
};
Module._resolveFilename = function (name, ...args) { return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args); };
Module._load = function (name, ...args) {
  if (name.endsWith('.css')) return {};
  if (name === 'react') return {
    ...load.call(this, name, ...args), memo: (component) => component, useCallback: (fn) => fn,
    useState(initial) { const index = harness.cursor++; if (!(index in harness.state)) harness.state[index] = typeof initial === 'function' ? initial() : initial;
      return [harness.state[index], (value) => { harness.state[index] = typeof value === 'function' ? value(harness.state[index]) : value; }]; },
    useMemo(factory, deps) { const index = harness.memoCursor++; const old = harness.memos[index];
      if (!old || deps.some((value, i) => value !== old.deps[i])) harness.memos[index] = { deps, value: factory() };
      return harness.memos[index].value; },
    useEffect(effect, deps) { const index = harness.effectCursor++; const old = harness.deps[index];
      if (!old || deps.some((value, i) => value !== old[i])) { harness.cleanup[index]?.(); harness.effects.push(() => { harness.cleanup[index] = effect(); }); harness.deps[index] = deps; } },
  };
  if (name === 'next/navigation') return { useRouter: () => ({ push() {} }) };
  if (name === 'next/dynamic') return { __esModule: true, default: (factory) => stub(factory.toString().includes('ContentAdvancedFilters') ? 'ContentAdvancedFilters' : 'BulkProgressModal') };
  if (name === '@/lib/admin-data') return data;
  if (name === '@/lib/admin-members') return adminMembers;
  if (name === '@/lib/admin-auth') return { logoutAdmin() {} };
  if (name === '@/lib/member-auth') return { logoutMember() {} };
  if (name === '@/lib/admin-console-data') return { syncAdminCategories: async () => { loaded.push('categories'); return []; },
    fetchAdminActivity: async () => { loaded.push('activity'); return []; }, recordAdminActivityRemote: async () => {} };
  if (name === '@/hooks/useDebounce') return { useDebounce: (value) => value };
  if (name === '@/hooks/useFilterPersistence') return { useFilterPersistence: (options) => ({ filterValues: options.defaultValues, presets: [], setFilterValues() {}, clearFilters() {} }) };
  if (name === 'lucide-react') return new Proxy({}, { get: (_target, key) => key === '__esModule' ? true : stub(String(key)) });
  if (name.startsWith('@/components/admin/')) { const component = name.split('/').at(-1); return { [component]: stub(component) }; }
  return load.call(this, name, ...args);
};
function stub(name) { if (!stubs.has(name)) { const component = function Placeholder() {}; component.displayName = name; stubs.set(name, component); } return stubs.get(name); }
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, filename);
const Dashboard = require('../app/admin/page.tsx').default;
const { AdminMembersView } = require('../components/admin/views/AdminMembersView.tsx');
const { AdminContentView } = require('../components/admin/views/AdminContentView.tsx');
const Announcements = require('../components/member/AdminAnnouncements.tsx').default;
function initialize() { harness?.cleanup.forEach((cleanup) => cleanup?.()); harness = { cursor: 0, memoCursor: 0, memos: [], state: [], effectCursor: 0, deps: [], effects: [], cleanup: [] }; }
function render(Component, props = {}) { harness.cursor = 0; harness.memoCursor = 0; harness.effectCursor = 0; return Component(props); }
async function settle() { harness.effects.splice(0).forEach((effect) => effect()); await new Promise(setImmediate); await new Promise(setImmediate); }
function all(tree) { if (Array.isArray(tree)) return tree.flatMap(all); return tree && typeof tree === 'object' ? [tree, ...all(tree.props?.children)] : []; }
function text(tree) { if (Array.isArray(tree)) return tree.map(text).join(' '); if (tree && typeof tree === 'object') return text(tree.props?.children); return typeof tree === 'string' || typeof tree === 'number' ? String(tree) : ''; }
function child(tree, name) { return all(tree).find((node) => node.type?.displayName === name); }
beforeEach(() => { initialize(); role = 'admin'; loaded = []; failStatus = false; failDelete = false; failSave = false; storedMembers = [member];
  global.window = { location: { replace() {} }, localStorage: { removeItem() {} } };
  global.fetch = async (url) => url === '/api/admin/auth/verify' ? Response.json({ id: 'actor', email: 'a@example.invalid', role, name: 'Actor' }) : Response.json({}); });

test('console initializes only authorized datasets and refuses selecting inaccessible views', async () => {
  for (const [userRole, expected, view] of [['content-editor', ['categories', 'content'], 'content'], ['member-reviewer', ['members'], 'members']]) {
    initialize(); role = userRole; loaded = [];
    render(Dashboard); await settle();
    let tree = render(Dashboard);
    assert.deepEqual(loaded.sort(), expected);
    assert.equal(child(tree, 'AdminSidebar').props.currentView, view);
    child(tree, 'AdminSidebar').props.onSelectView('settings');
    tree = render(Dashboard);
    assert.equal(child(tree, 'AdminSidebar').props.currentView, view);
  }
});

test('member status updates alter console/drawer only after successful persistence', async () => {
  render(Dashboard); await settle();
  let tree = render(Dashboard);
  child(tree, 'AdminSidebar').props.onSelectView('members');
  tree = render(Dashboard);
  child(tree, 'AdminMembersView').props.onOpenMember(member);
  tree = render(Dashboard);
  failStatus = true;
  await assert.rejects(child(tree, 'MemberDetailDrawer').props.onUpdateStatus('one', 'active', 'Reviewed'), /Status rejected/);
  tree = render(Dashboard);
  assert.equal(child(tree, 'MemberDetailDrawer').props.member.status, 'pending');
  assert.match(text(tree), /Save failed/);
  failStatus = false;
  await child(tree, 'MemberDetailDrawer').props.onUpdateStatus('one', 'active', 'Reviewed');
  tree = render(Dashboard);
  assert.equal(child(tree, 'MemberDetailDrawer').props.member.status, 'active');
  assert.equal(child(tree, 'AdminMembersView').props.members[0].reviewNote, 'Reviewed');
});

test('member deletions and content saves retain displayed data/modals on failed server mutations', async () => {
  render(Dashboard); await settle();
  let tree = render(Dashboard);
  child(tree, 'AdminSidebar').props.onSelectView('members'); tree = render(Dashboard);
  child(tree, 'AdminMembersView').props.onOpenMember(member); tree = render(Dashboard);
  child(tree, 'MemberDetailDrawer').props.onDeleteMember('one'); tree = render(Dashboard);
  failDelete = true;
  await assert.rejects(child(tree, 'ConfirmDeleteDialog').props.onConfirm(), /Delete rejected/);
  tree = render(Dashboard);
  assert.ok(child(tree, 'ConfirmDeleteDialog'));
  assert.equal(child(tree, 'AdminMembersView').props.members.length, 1);
  failDelete = false;
  await child(tree, 'ConfirmDeleteDialog').props.onConfirm(); tree = render(Dashboard);
  assert.equal(child(tree, 'AdminMembersView').props.members.length, 0);
  assert.equal(child(tree, 'ConfirmDeleteDialog'), undefined);
  child(tree, 'AdminSidebar').props.onSelectView('content'); tree = render(Dashboard);
  child(tree, 'AdminContentView').props.onAddNew(); tree = render(Dashboard);
  failSave = true;
  await assert.rejects(child(tree, 'ContentEditorModal').props.onSave({ id: 'paper', title: 'Unsaved' }), /Save rejected/);
  tree = render(Dashboard);
  assert.equal(child(tree, 'ContentEditorModal').props.isOpen, true);
  failSave = false;
  await child(tree, 'ContentEditorModal').props.onSave({ id: 'paper', title: 'Saved' }); tree = render(Dashboard);
  assert.equal(child(tree, 'ContentEditorModal').props.isOpen, false);
});

test('refreshed member lists clamp pagination after bulk deletion', async () => {
  const rows = Array.from({ length: 9 }, (_, index) => ({ ...member, id: String(index), fullName: `Reader ${index}` }));
  const props = { members: rows, onOpenMember() {}, onUpdateStatus() {}, onExportCsv() {}, onRefresh: async () => {} };
  let tree = render(AdminMembersView, props); await settle(); tree = render(AdminMembersView, props);
  all(tree).find((node) => node.props?.['aria-label'] === 'Next page').props.onClick();
  tree = render(AdminMembersView, props);
  assert.match(text(tree), /Page\s+2\s+of\s+2/);
  const reduced = { ...props, members: rows.slice(0, 8) };
  render(AdminMembersView, reduced); await settle(); tree = render(AdminMembersView, reduced);
  const table = all(tree).find((node) => node.type === 'tbody');
  assert.equal(all(table).filter((node) => node.type === 'tr').length, 8);
  assert.doesNotMatch(text(table), /No members match/);
});

test('member announcement read state changes only when server confirms persistence', async () => {
  const announcement = { id: 'announcement', subject: 'A persisted announcement', body: 'Message', createdAt: '2026-10-13', readAt: null };
  let fail = true;
  global.fetch = async (_url, options) => options?.method === 'PATCH'
    ? Response.json(fail ? { error: 'Read rejected' } : { readAt: '2026-10-13' }, { status: fail ? 500 : 200 })
    : Response.json({ announcements: [announcement] });
  render(Announcements); await settle(); let tree = render(Announcements);
  all(tree).find((node) => node.type === 'button').props.onClick(); await settle(); tree = render(Announcements);
  assert.match(text(tree), /Read rejected/);
  assert.match(text(tree), /Mark as read/);
  fail = false;
  all(tree).find((node) => node.type === 'button').props.onClick(); await settle(); tree = render(Announcements);
  assert.doesNotMatch(text(tree), /Mark as read/);
});

test('bulk content status and category update only server-confirmed IDs and preserve per-item failures', async () => {
  const original = [
    { id: 'present', title: 'Present', kind: 'academic', category: 'Research', status: 'draft', tags: [] },
    { id: 'missing', title: 'Missing', kind: 'academic', category: 'Research', status: 'draft', tags: [] },
  ];
  cachedContent = original.map((item) => ({ ...item }));
  const props = { content: original, contentCategories: [], onOpenEditor() {}, onOpenDelete() {}, onToggleStatus() {}, onAddNew() {}, onSaveCategories: async () => {} };
  global.fetch = async () => Response.json({ ids: ['present'], results: [{ id: 'present', success: true }, { id: 'missing', success: false, error: 'Content not found' }] });
  let tree = render(AdminContentView, props); await settle(); tree = render(AdminContentView, props);
  all(tree).find((node) => node.props?.ariaLabel === 'Select all content items').props.onChange(true);
  tree = render(AdminContentView, props);
  child(tree, 'BulkActionBar').props.actions.find((action) => action.label === 'Publish').onClick();
  tree = render(AdminContentView, props);
  const results = await child(tree, 'BulkProgressModal').props.onExecuteBatch(['present', 'missing']);
  assert.deepEqual(results, [{ id: 'present', success: true }, { id: 'missing', success: false, error: 'Content not found' }]);
  assert.equal(cachedContent.find((item) => item.id === 'present').status, 'published');
  assert.equal(cachedContent.find((item) => item.id === 'missing').status, 'draft');

  global.prompt = () => 'Practice';
  tree = render(AdminContentView, props);
  child(tree, 'BulkActionBar').props.actions.find((action) => action.label === 'Set Category').onClick();
  tree = render(AdminContentView, props);
  assert.equal(child(tree, 'BulkProgressModal').props.action, 'updateCategory');
  await child(tree, 'BulkProgressModal').props.onExecuteBatch(['present', 'missing']);
  assert.equal(cachedContent.find((item) => item.id === 'present').category, 'Practice');
  assert.equal(cachedContent.find((item) => item.id === 'missing').category, 'Research');
  delete global.prompt;
});
