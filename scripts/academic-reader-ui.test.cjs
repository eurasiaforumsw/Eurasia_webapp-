const assert = require('node:assert/strict');
const { test, beforeEach, afterEach } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
const load = Module._load;
let harness;
let cache;
let viewRequest;
let likeRequest;
let related;
let viewCalls;
let likeCalls;
let copiedLinks;
const stubs = new Map();
const blank = (id) => ({ contentId: id, viewCount: 0, downloadCount: 0, likeCount: 0, likedBy: [], lastUpdated: '' });
const stats = (patch = {}) => ({ ...blank('paper'), viewCount: 23, likeCount: 5, likedBy: ['visitor'], ...patch });
function stub(name) {
  if (!stubs.has(name)) { const component = function Placeholder() {}; component.displayName = name; stubs.set(name, component); }
  return stubs.get(name);
}
Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};
Module._load = function (name, ...args) {
  if (name === 'react') return {
    ...load.call(this, name, ...args),
    useState(initial) {
      const index = harness.cursor++;
      if (!(index in harness.state)) harness.state[index] = typeof initial === 'function' ? initial() : initial;
      return [harness.state[index], (value) => { harness.state[index] = typeof value === 'function' ? value(harness.state[index]) : value; }];
    },
    useMemo: (factory) => factory(),
    useEffect(effect, deps) {
      const index = harness.effectCursor++;
      const previous = harness.deps[index];
      if (!previous || deps.some((value, i) => value !== previous[i])) {
        harness.cleanup[index]?.();
        harness.effects.push(() => { harness.cleanup[index] = effect(); });
        harness.deps[index] = deps;
      }
    },
  };
  if (name === 'lucide-react') return new Proxy({}, { get: (_target, key) => key === '__esModule' ? true : stub(String(key)) });
  if (name === 'next/link') return { __esModule: true, default: stub('Link') };
  if (name === '@/contexts/I18nContext') return { useI18n: () => ({ t: (key) => key }) };
  if (name === '@/hooks/useTranslatedFields') return { useTranslatedFields: () => ({ state: 'idle' }) };
  if (name === '@/lib/admin-data') return { getAdminContent: () => [], getPublishedContentBySlug: () => null, getRelatedContent: () => [], ADMIN_CONTENT_KEY: 'content' };
  if (name === '@/lib/member-auth') return { getSessionMember: () => null };
  if (name === '@/lib/content-engagement') return {
    getContentEngagement: (id) => cache.get(id) || blank(id),
    hasUserLiked: (id) => Boolean(cache.get(id)?.likedBy.length),
    incrementViewCount: async (id) => { viewCalls.push(id); const result = await viewRequest(id); cache.set(id, result); return result; },
    toggleLike: async (id) => { likeCalls.push(id); const result = await likeRequest(id); cache.set(id, result); return { engagement: result }; },
    incrementDownloadCount: async (id) => cache.get(id) || blank(id),
  };
  if (name.startsWith('@/components/')) {
    const namePart = name.split('/').at(-1);
    if (namePart === 'EngagementRow') return { EngagementRow: stub('EngagementRow'), RecordView: stub('RecordView') };
    return { __esModule: true, default: stub(namePart), [namePart]: stub(namePart), Button: stub('Button') };
  }
  return load.call(this, name, ...args);
};
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, filename);
const ArticleView = require('../components/efsw/ArticleView.tsx').default;
const ShareBar = require('../components/efsw/ShareBar.tsx').default;
const seed = { id: 'paper', title: 'The matching paper', category: 'Research', summary: 'A saved summary', body: 'Full saved content.' };
const readerProps = { kind: 'academic', slug: 'paper', seed, backHref: '/academic-documents', contentSource: 'public' };
const globals = ['window', 'document', 'navigator', 'fetch', 'CSS'].map((name) => [name, Object.getOwnPropertyDescriptor(global, name)]);
function initialize() {
  harness?.cleanup.forEach((cleanup) => cleanup?.());
  harness = { cursor: 0, state: [], effectCursor: 0, deps: [], cleanup: [], effects: [] };
}
function render(Component, props) { harness.cursor = 0; harness.effectCursor = 0; return Component(props); }
async function effects() { harness.effects.splice(0).forEach((effect) => effect()); await new Promise(setImmediate); await new Promise(setImmediate); }
function all(tree) { if (Array.isArray(tree)) return tree.flatMap(all); return tree && typeof tree === 'object' ? [tree, ...all(tree.props?.children)] : []; }
function text(tree) { if (Array.isArray(tree)) return tree.map(text).join(' '); if (tree && typeof tree === 'object') return text(tree.props?.children); return typeof tree === 'string' || typeof tree === 'number' ? String(tree) : ''; }
function likeButton(tree) { return all(tree).find((node) => node.type === 'button' && /^(?:Unlike|Like) document$/.test(node.props?.['aria-label'])); }
beforeEach(() => {
  initialize(); cache = new Map(); related = []; viewCalls = []; likeCalls = []; copiedLinks = [];
  viewRequest = async () => stats(); likeRequest = async () => stats({ likeCount: 4, likedBy: [] });
  global.window = { location: { origin: 'https://reader.example.invalid', href: 'https://reader.example.invalid/academic-documents/paper' },
    addEventListener() {}, removeEventListener() {}, setTimeout: () => 1, clearTimeout() {} };
  global.document = { documentElement: { style: { setProperty() {} } } };
  Object.defineProperty(global, 'navigator', { configurable: true, value: { clipboard: { writeText: async (url) => copiedLinks.push(url) } } });
  global.CSS = { supports: () => true };
  global.fetch = async (url) => Response.json(url === '/api/content/public' ? { items: related } : { images: [] });
});
afterEach(() => {
  harness.cleanup.forEach((cleanup) => cleanup?.());
  harness = null;
  for (const [name, descriptor] of globals) {
    if (descriptor) Object.defineProperty(global, name, descriptor);
    else delete global[name];
  }
});

test('reader blocks a premature like and shows the persisted like/view state after recording this document view', async () => {
  let resolveView;
  viewRequest = () => new Promise((resolve) => { resolveView = resolve; });
  let tree = render(ArticleView, readerProps);
  assert.equal(likeButton(tree).props.disabled, true);
  assert.equal(text(likeButton(tree)).trim(), '—');
  likeButton(tree).props.onClick();
  await effects();
  assert.deepEqual(likeCalls, []);
  assert.deepEqual(viewCalls, ['paper']);
  resolveView(stats());
  await new Promise(setImmediate);
  tree = render(ArticleView, readerProps);
  assert.equal(likeButton(tree).props.disabled, false);
  assert.equal(likeButton(tree).props['aria-pressed'], true);
  assert.equal(text(likeButton(tree)).trim(), '5');
  assert.ok(all(tree).some((node) => node.props?.['aria-label'] === '23 views'));
  assert.equal(all(tree).some((node) => node.type?.displayName === 'RecordView'), false);

  likeButton(tree).props.onClick();
  await new Promise(setImmediate);
  tree = render(ArticleView, readerProps);
  assert.deepEqual(likeCalls, ['paper']);
  assert.equal(likeButton(tree).props['aria-pressed'], false);
  assert.equal(text(likeButton(tree)).trim(), '4');
});

test('a failed initial statistics write keeps like disabled and retry recovers without a false zero total', async () => {
  viewRequest = async () => { throw new Error('Database offline'); };
  render(ArticleView, readerProps); await effects();
  let tree = render(ArticleView, readerProps);
  assert.equal(likeButton(tree).props.disabled, true);
  assert.equal(text(likeButton(tree)).trim(), '—');
  assert.match(text(tree), /Database offline/);
  viewRequest = async () => stats();
  all(tree).find((node) => node.type === 'button' && text(node) === 'Retry document statistics').props.onClick();
  render(ArticleView, readerProps); await effects();
  tree = render(ArticleView, readerProps);
  assert.doesNotMatch(text(tree), /Database offline/);
  assert.equal(likeButton(tree).props.disabled, false);
  assert.equal(text(likeButton(tree)).trim(), '5');
});

test('failed unlike preserves confirmed counts and encoded related/share links open the saved document ID', async () => {
  const specialId = 'paper #2?ภาษาไทย/guide';
  related = [{ ...seed, id: specialId, title: 'Another document', kind: 'document' }];
  const props = { ...readerProps, slug: specialId, seed: { ...seed, id: specialId } };
  viewRequest = async () => stats({ contentId: specialId });
  likeRequest = async () => { throw new Error('Like could not be saved'); };
  render(ArticleView, props); await effects();
  let tree = render(ArticleView, props);
  for (const share of all(tree).filter((node) => node.type?.displayName === 'ShareBar')) {
    assert.equal(share.props.path, `/academic-documents/${encodeURIComponent(specialId)}`);
  }
  // Related documents are selected from the public response, with their own ID.
  initialize();
  viewRequest = async () => stats();
  render(ArticleView, readerProps); await effects();
  tree = render(ArticleView, readerProps);
  assert.ok(all(tree).some((node) => node.props?.className === 'efsw-article__related-card'
    && node.props.href === `/academic-documents/${encodeURIComponent(specialId)}`));
  likeButton(tree).props.onClick(); await new Promise(setImmediate);
  tree = render(ArticleView, readerProps);
  assert.equal(text(likeButton(tree)).trim(), '5');
  assert.equal(likeButton(tree).props['aria-pressed'], true);
  assert.match(text(tree), /Like could not be saved/);
});

test('share buttons and copied URLs update when navigation changes the supplied document path', async () => {
  const first = { title: seed.title, path: '/academic-documents/paper' };
  render(ShareBar, first); await effects();
  let tree = render(ShareBar, first);
  all(tree).find((node) => node.type === 'button' && node.props['aria-label'] === 'article.copyLink').props.onClick();
  await new Promise(setImmediate);
  const secondPath = `/academic-documents/${encodeURIComponent('paper #2?ภาษาไทย/guide')}`;
  const second = { title: 'Another document', path: secondPath };
  global.window.location.href = `https://reader.example.invalid${secondPath}?tracking=discarded#section`;
  render(ShareBar, second); await effects();
  tree = render(ShareBar, second);
  const facebook = all(tree).find((node) => node.props?.className === 'efsw-share__button efsw-share__button--facebook');
  assert.equal(new URL(facebook.props.href).searchParams.get('u'), `https://reader.example.invalid${secondPath}`);
  all(tree).find((node) => node.type === 'button' && node.props['aria-label'] === 'article.copyLink').props.onClick();
  await new Promise(setImmediate);
  assert.deepEqual(copiedLinks, ['https://reader.example.invalid/academic-documents/paper', `https://reader.example.invalid${secondPath}`]);
});
