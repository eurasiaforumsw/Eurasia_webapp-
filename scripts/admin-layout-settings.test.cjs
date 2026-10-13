const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
const load = Module._load;
const writes = [];
let databaseError = null;
const database = {
  from(table) {
    let payload;
    const result = () => ({ data: payload || { config: {} }, error: databaseError });
    const query = {
      select() { return query; }, eq() { return query; },
      upsert(value) { payload = value; writes.push({ table, value }); return query; },
      maybeSingle() { return Promise.resolve(result()); },
      single() { return Promise.resolve(result()); },
      then(yes, no) { return Promise.resolve(result()).then(yes, no); },
    };
    return query;
  },
};
let hookHarness;
Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};
Module._load = function (name, ...args) {
  if (name === '@supabase/supabase-js') return { createClient: () => database };
  if (name === '@/components/admin/AdminLayoutClient') return { AdminLayoutClient: ({ children }) => children };
  if (name === '@/components/ui/toast') return { useToast: () => ({ addToast() {} }) };
  if (name.endsWith('.css')) return {};
  if (name === 'react' && hookHarness) return {
    ...load.call(this, name, ...args),
    useState(initial) {
      const index = hookHarness.cursor++;
      if (!(index in hookHarness.state)) hookHarness.state[index] = typeof initial === 'function' ? initial() : initial;
      return [hookHarness.state[index], (value) => {
        hookHarness.state[index] = typeof value === 'function' ? value(hookHarness.state[index]) : value;
      }];
    },
    useEffect() {},
  };
  return load.call(this, name, ...args);
};
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, filename);
};

process.env.JWT_SECRET = 'admin-layout-test-0123456789abcdef0123456789';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://layout-test.example.invalid';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-public-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
const { SignJWT } = require('jose');
const { NextRequest } = require('next/server');
const layout = require('../app/api/layout/route.ts');
const settings = require('../app/api/settings/route.ts');
const storage = new Map();
global.window = { localStorage: {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
} };
const admin = require('../lib/admin-data.ts');
const permissions = require('../lib/admin-permissions.ts');
const policy = require('../lib/security/policy.ts');
const publicData = require('../lib/public-site-data.ts');

async function token(role = 'admin', legacy = false) {
  return new SignJWT({ email: legacy ? 'admin@efsw.local' : 'admin@example.com', role,
    ...(legacy ? {} : { memberId: 'admin-member-one' }) })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));
}
function request(pathname, body, headers = {}) {
  return new NextRequest(`http://localhost:2024${pathname}`, {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
  });
}

test('layout and settings accept verified administrator cookie, member cookie and Bearer sessions', async () => {
  const legacy = await token('super-admin', true);
  const member = await token();
  for (const headers of [{ cookie: `admin_token=${legacy}` }, { cookie: `member_token=${member}` }, { authorization: `Bearer ${member}` }]) {
    assert.equal((await layout.POST(request('/api/layout', { config: { heroHeadline: 'Shared heading' } }, headers))).status, 200);
    assert.equal((await settings.POST(request('/api/settings', { settings: { organizationName: 'Shared name' } }, headers))).status, 200);
  }
});

test('forged cookies and content editor roles cannot write layout or settings directly', async () => {
  for (const headers of [{}, { cookie: 'admin_token=forged' }, { cookie: `member_token=${await token('content-editor')}` }]) {
    writes.length = 0;
    const expected = headers.cookie?.includes('member_token') ? 403 : 401;
    assert.equal((await layout.POST(request('/api/layout', { config: {} }, headers))).status, expected);
    assert.equal((await settings.POST(request('/api/settings', { settings: {} }, headers))).status, expected);
    assert.equal(writes.length, 0);
  }
});

test('legacy administrators save settings without using their email as a member foreign key', async () => {
  writes.length = 0;
  await settings.POST(request('/api/settings', { settings: {} }, { cookie: `admin_token=${await token('super-admin', true)}` }));
  assert.equal(writes[0].value.updated_by, null);
  await settings.POST(request('/api/settings', { settings: {} }, { cookie: `member_token=${await token()}` }));
  assert.equal(writes[1].value.updated_by, 'admin-member-one');
  assert.equal(writes[0].value.id, 'default');
});

test('invalid JSON objects are rejected before database writes', async () => {
  const headers = { authorization: `Bearer ${await token()}` };
  writes.length = 0;
  for (const body of [null, { config: [] }, { settings: [] }]) {
    assert.equal((await layout.POST(request('/api/layout', body, headers))).status, 400);
    assert.equal((await settings.POST(request('/api/settings', body, headers))).status, 400);
  }
  assert.equal(writes.length, 0);
});

test('failed remote layout and settings saves preserve the last persisted cache', async () => {
  const originalLayout = { ...admin.defaultLayoutConfig, heroHeadline: 'Persisted heading' };
  const originalSettings = { ...admin.getAdminSettings(), organizationName: 'Persisted name' };
  admin.saveAdminLayout(originalLayout);
  admin.saveAdminSettings(originalSettings);
  global.fetch = async () => Response.json({ error: 'Database unavailable' }, { status: 503 });
  await assert.rejects(admin.saveAdminLayoutRemote({ ...originalLayout, heroHeadline: 'Unsaved heading' }), /Database unavailable/);
  await assert.rejects(admin.saveAdminSettingsRemote({ ...originalSettings, organizationName: 'Unsaved name' }), /Database unavailable/);
  assert.equal(admin.getAdminLayout().heroHeadline, originalLayout.heroHeadline);
  assert.equal(admin.getAdminSettings().organizationName, originalSettings.organizationName);
});

test('remote layout and settings sync merge default fields while preserving empty saved arrays', async () => {
  global.fetch = async (url, options) => {
    assert.equal(options.cache, 'no-store');
    return Response.json(url === '/api/layout' ? { config: { boardMembers: [], partnerLogos: [], historyItems: [] } }
      : { settings: { organizationEmail: 'official@example.com' } });
  };
  const nextLayout = await admin.syncAdminLayout();
  assert.deepEqual(nextLayout.boardMembers, []);
  assert.deepEqual(nextLayout.partnerLogos, []);
  assert.deepEqual(nextLayout.historyItems, []);
  assert.equal(nextLayout.heroHeadline, admin.defaultLayoutConfig.heroHeadline);
  const nextSettings = await admin.syncAdminSettings();
  assert.equal(nextSettings.contactEmail, 'official@example.com');
  assert.ok(nextSettings.organizationName);
});

test('remote load failures are surfaced to the console instead of reporting a stale cache as refreshed', async () => {
  global.fetch = async () => Response.json({ error: 'Offline' }, { status: 503 });
  await assert.rejects(admin.syncAdminLayout(), /Failed to fetch layout/);
  await assert.rejects(admin.syncAdminSettings(), /Failed to fetch settings/);
});

test('public feeds load persisted content and accept empty results after deletion', async () => {
  const stale = { id: 'local-draft', kind: 'news', status: 'published', title: 'Browser-only heading' };
  storage.set(admin.ADMIN_CONTENT_KEY, JSON.stringify([stale]));
  global.fetch = async (url, options) => {
    assert.equal(url, '/api/content/public?kind=news');
    assert.equal(options.cache, 'no-store');
    return Response.json({ items: [] });
  };
  assert.deepEqual(await publicData.fetchPublishedContent('news'), []);
  global.fetch = async () => Response.json({ items: [{ ...stale, id: 'persisted-story', title: 'Shared heading' }] });
  assert.equal((await publicData.fetchPublishedContent('news'))[0].title, 'Shared heading');
});

test('console navigation follows the roles enforced by each view API', () => {
  const endpoints = { content: '/api/content', layout: '/api/layout', settings: '/api/settings',
    members: '/api/members/bulk', broadcast: '/api/broadcast/campaigns', analytics: '/api/admin/analytics/overview',
    'academic-analytics': '/api/admin/academic/stats', messages: '/api/admin/messages', moderation: '/api/admin/messages/all' };
  for (const role of ['super-admin', 'admin', 'pr', 'content-editor', 'member-reviewer']) {
    assert.equal(permissions.canAccessAdminView(role, permissions.defaultAdminView(role)), true);
    for (const [view, endpoint] of Object.entries(endpoints)) {
      assert.equal(permissions.canAccessAdminView(role, view), policy.apiRoles(endpoint, 'POST').includes(role), `${role}: ${view}`);
    }
  }
});

function findElement(element, matches) {
  if (!element || typeof element !== 'object') return null;
  if (matches(element)) return element;
  for (const child of [].concat(element.props?.children || [])) {
    const found = findElement(child, matches);
    if (found) return found;
  }
  return null;
}

test('layout and settings forms await persistence and show an error on failure', async () => {
  for (const [file, exportName, props] of [
    ['../components/admin/views/AdminLayoutView.tsx', 'AdminLayoutView', { layout: admin.defaultLayoutConfig, onOpenLeaderEditor() {}, onDeleteLeader() {} }],
    ['../components/admin/views/AdminSettingsView.tsx', 'AdminSettingsView', { settings: admin.getAdminSettings() }],
  ]) {
    hookHarness = { state: [], cursor: 0 };
    const View = require(file)[exportName].type;
    let rejectSave;
    const onSave = () => new Promise((_resolve, reject) => { rejectSave = reject; });
    const render = () => {
      hookHarness.cursor = 0;
      return View({ ...props, onSaveLayout: onSave, onSaveSettings: onSave });
    };
    const pending = findElement(render(), (element) => element.type === 'form').props.onSubmit({ preventDefault() {} });
    assert.equal(findElement(render(), (element) => element.type === 'button' && element.props.type === 'submit').props.disabled, true);
    rejectSave(new Error('Save rejected'));
    await pending;
    const failed = render();
    assert.equal(findElement(failed, (element) => element.props?.role === 'alert').props.children, 'Save rejected');
    assert.equal(findElement(failed, (element) => element.type === 'button' && element.props.type === 'submit').props.disabled, false);
    hookHarness = null;
  }
});

test('admin layout has one application wrapper and production login omits demo credentials', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const Layout = require('../app/admin/layout.tsx').default;
  const markup = renderToStaticMarkup(React.createElement(Layout, null, React.createElement('p', null, 'Admin')));
  assert.doesNotMatch(markup, /<(html|body)[\s>]/i);
  const Login = require('../app/admin/login/page.tsx').default;
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const login = renderToStaticMarkup(React.createElement(Login));
    assert.doesNotMatch(login, /Demo access|EFSW-demo-admin-2024|Prototype mode|stored locally/);
  } finally { process.env.NODE_ENV = previous; }
});
