const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
const load = Module._load;
let cookieValue;
let settings = { organizationName: 'Saved Forum', contactEmail: 'saved@example.com', defaultLocale: 'th', reviewNotifications: false };
let loads = 0;
let requestStatus = 200;
let settingsPending = false;
let harness;
const listeners = new Map();

Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};
Module._load = function (name, ...args) {
  if (name.endsWith('.css')) return {};
  if (name === 'next/font/google') return { Inter: () => ({ variable: '--font-inter' }), Bricolage_Grotesque: () => ({ variable: '--font-bric' }) };
  if (name === 'next/headers') return { cookies: () => ({ get: () => ({ value: cookieValue }) }), headers: () => ({ get: () => undefined }) };
  if (['@/components/efsw/RevealObserver', '@/components/efsw/SmoothScrollProvider', '@/contexts/ThemeContext',
    '@/components/ui/toast', '@/components/ErrorBoundary', '@/components/SkipLink'].includes(name)) {
    const component = ({ children }) => children ?? null;
    return { RevealObserver: component, SmoothScrollProvider: component, ThemeProvider: component,
      ToastProvider: component, ErrorBoundary: component, SkipLink: component };
  }
  if (name === '@/app/api/settings/route') return { GET: async () => {
    loads++;
    if (settingsPending) return new Promise(() => {});
    return Response.json({ settings }, { status: requestStatus });
  } };
  if (name === 'react' && harness) return {
    ...load.call(this, name, ...args),
    useState(initial) {
      const i = harness.cursor++;
      if (!(i in harness.state)) harness.state[i] = typeof initial === 'function' ? initial() : initial;
      return [harness.state[i], (value) => { harness.state[i] = value; }];
    },
    useEffect(effect) { if (!harness.mounted) harness.effects.push(effect); },
  };
  return load.call(this, name, ...args);
};
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, filename);

const { normalizeSiteSettings, resolveInitialLocale, defaultSiteSettings } = require('../lib/site-settings.ts');
const { getPublicSiteSettings } = require('../lib/site-settings-server.ts');
const { SiteFooter } = require('../components/efsw/SiteFooter.tsx');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const RootLayout = require('../app/layout.tsx').default;
const data = require('../lib/admin-data.ts');

test('saved site settings normalize legacy email and invalid locale values', () => {
  assert.equal(normalizeSiteSettings({ organizationEmail: 'legacy@example.com' }).contactEmail, 'legacy@example.com');
  assert.equal(normalizeSiteSettings({ defaultLocale: 'invalid' }).defaultLocale, 'en');
  assert.equal(normalizeSiteSettings({ reviewNotifications: false }).reviewNotifications, false);
  assert.deepEqual(normalizeSiteSettings(null), defaultSiteSettings);
});

test('a saved visitor locale takes priority while new visitors get the persisted site default', async () => {
  let requests = 0;
  const getSettings = async () => { requests++; return settings; };
  assert.equal(await resolveInitialLocale('ko', getSettings), 'ko');
  assert.equal(requests, 0);
  assert.equal(await resolveInitialLocale(undefined, getSettings), 'th');
  assert.equal(requests, 1);
});

test('root layout renders the saved default locale and honors a visitor cookie', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://settings-test.example.invalid';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  cookieValue = undefined;
  const initial = await RootLayout({ children: null });
  assert.equal(initial.props.lang, 'th');
  cookieValue = 'ko';
  const count = loads;
  const preferred = await RootLayout({ children: null });
  assert.equal(preferred.props.lang, 'ko');
  assert.equal(loads, count);
  cookieValue = undefined;
});

test('site settings lookup falls back to valid defaults when the remote service fails', async () => {
  requestStatus = 503;
  try { assert.deepEqual(await getPublicSiteSettings(), defaultSiteSettings); }
  finally { requestStatus = 200; }
});

test('an unavailable settings service cannot delay document rendering beyond three seconds', async () => {
  settingsPending = true;
  const started = Date.now();
  try {
    assert.deepEqual(await getPublicSiteSettings(), defaultSiteSettings);
    assert.ok(Date.now() - started < 3500);
  } finally { settingsPending = false; }
});

test('footer renders organization and contact from persisted settings', () => {
  const html = renderToStaticMarkup(React.createElement(SiteFooter, { layout: data.defaultLayoutConfig, settings }));
  assert.match(html, /Saved Forum/);
  assert.match(html, /href="mailto:saved@example\.com"/);
  assert.doesNotMatch(html, /support@eurasiaforumsw\.org/);
});

test('public settings refresh loads the shared configuration independent of local storage', async () => {
  global.window = {
    localStorage: { getItem: () => JSON.stringify({ organizationName: 'Stale browser value' }) },
    addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name),
  };
  global.document = { visibilityState: 'visible', addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) };
  global.fetch = async (url, options) => {
    assert.equal(url, '/api/settings');
    assert.equal(options.cache, 'no-store');
    return Response.json({ settings });
  };
  harness = { state: [], effects: [], cursor: 0, mounted: false };
  try {
    const { usePublicSettings } = require('../hooks/use-public-site-data.ts');
    const render = () => { harness.cursor = 0; return usePublicSettings(); };
    assert.equal(render().organizationName, defaultSiteSettings.organizationName);
    const cleanups = harness.effects.map((effect) => effect());
    harness.mounted = true;
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(render().organizationName, 'Saved Forum');
    settings = { ...settings, contactEmail: 'updated@example.com' };
    listeners.get('pageshow')();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(render().contactEmail, 'updated@example.com');
    cleanups.forEach((cleanup) => cleanup?.());
  } finally { harness = undefined; }
});

test('changing language persists a visitor cookie for the next server render', () => {
  const writes = [];
  global.localStorage = { setItem: (...args) => writes.push(args), getItem: () => null };
  global.document = { documentElement: { lang: 'th' }, cookie: '' };
  harness = { state: [], effects: [], cursor: 0, mounted: false };
  try {
    delete require.cache[path.join(root, 'contexts/I18nContext.tsx')];
    const { I18nProvider } = require('../contexts/I18nContext.tsx');
    const provider = I18nProvider({ children: null, defaultLocale: 'th', messages: { en: {}, th: {}, ko: {} } });
    provider.props.value.setLocale('ko');
    assert.equal(global.document.documentElement.lang, 'ko');
    assert.match(global.document.cookie, /^efsw.locale=ko; Path=\//);
    assert.deepEqual(writes[0], ['efsw.locale', 'ko']);
  } finally { harness = undefined; }
});
