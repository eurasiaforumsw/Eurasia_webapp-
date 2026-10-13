const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
const load = Module._load;
let harness;
Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};
Module._load = function (name, ...args) {
  if (name === 'react') return {
    ...load.call(this, name, ...args), memo: (component) => component,
    useState(initial) {
      const index = harness.cursor++;
      if (!Object.hasOwn(harness.state, index)) harness.state[index] = typeof initial === 'function' ? initial() : initial;
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
  if (name === 'lucide-react' || name === 'recharts') return new Proxy({}, { get: (_target, key) => key === '__esModule' ? true : function Icon() {} });
  return load.call(this, name, ...args);
};
require.extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, filename);
const { AnalyticsDashboard } = require('../components/admin/AnalyticsDashboard.tsx');
const { AdminAcademicAnalyticsView } = require('../components/admin/views/AdminAcademicAnalyticsView.tsx');
function initialize() { harness = { cursor: 0, state: [], effectCursor: 0, deps: [], cleanup: [], effects: [] }; }
function render(Component) { harness.cursor = 0; harness.effectCursor = 0; return Component({}); }
async function effects() {
  harness.effects.splice(0).forEach((effect) => effect());
  await new Promise(setImmediate);
  await new Promise(setImmediate);
}
function all(tree) {
  if (Array.isArray(tree)) return tree.flatMap(all);
  return tree && typeof tree === 'object' ? [tree, ...all(tree.props?.children)] : [];
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join(' ');
  if (tree && typeof tree === 'object') return text(tree.props?.children);
  return typeof tree === 'string' || typeof tree === 'number' ? String(tree) : '';
}
const metric = { total: 2, period: 2, previous: 1 };
const responses = {
  overview: { members: { total: 1, growth: 0, newInPeriod: 1 }, content: { total: 1, news: 0, events: 0, academic: 1 },
    engagement: { likes: metric, saves: metric, views: metric, shares: metric }, sessions: { active: 0 } },
  members: { totalMembers: 1, mostActiveMembers: [], newMembers: { count: 0, members: [] },
    membersByType: {}, membersByCountry: [], memberGrowth: [] },
  content: { topLiked: [], topViewed: [], topSaved: [], byType: [], byStatus: [] },
  engagement: { likes: [], saves: [], views: [], newMembers: [] },
};

test('selecting a new analytics range changes all API requests and chart labels', async () => {
  initialize();
  const calls = [];
  global.fetch = async (url) => {
    calls.push(url);
    const endpoint = new URL(url, 'http://localhost').pathname.split('/').at(-1);
    return Response.json(responses[endpoint]);
  };
  render(AnalyticsDashboard);
  await effects();
  assert.equal(calls.length, 4);
  assert.ok(calls.every((url) => url.endsWith('?range=30d')));
  let tree = render(AnalyticsDashboard);
  all(tree).find((node) => node.props?.className === 'filter__trigger filter__trigger--active').props.onClick();
  tree = render(AnalyticsDashboard);
  all(tree).find((node) => node.props?.className?.startsWith('filter__option') && text(node) === 'Last 7 days').props.onClick();
  render(AnalyticsDashboard);
  await effects();
  assert.equal(calls.length, 8);
  assert.ok(calls.slice(4).every((url) => url.endsWith('?range=7d')));
  assert.match(text(render(AnalyticsDashboard)), /Last 7 days\s+activity/);
});

test('dashboard displays API errors and retries without discarding the chosen range', async () => {
  initialize();
  let calls = 0;
  global.fetch = async () => { calls++; return Response.json({ error: 'Statistics schema unavailable' }, { status: 500 }); };
  render(AnalyticsDashboard);
  await effects();
  const tree = render(AnalyticsDashboard);
  assert.match(text(tree), /Statistics schema unavailable/);
  all(tree).find((node) => node.type === 'button' && text(node).includes('Retry')).props.onClick();
  render(AnalyticsDashboard);
  await effects();
  assert.equal(calls, 8);
});

test('Academic Stats loads persisted server documents and shows a failure instead of zero totals', async () => {
  initialize();
  let requested;
  global.fetch = async (url) => {
    requested = url;
    return Response.json({ documents: [{ id: 'remote-paper', title: 'Server paper', author: 'Author', downloads: 42, views: 12, likes: 3 }] });
  };
  render(AdminAcademicAnalyticsView);
  await effects();
  assert.equal(requested, '/api/admin/analytics/academic');
  const loaded = render(AdminAcademicAnalyticsView);
  assert.match(text(loaded), /Server paper/);
  assert.match(text(loaded), /42/);

  initialize();
  global.fetch = async () => Response.json({ error: 'Storage unavailable' }, { status: 500 });
  render(AdminAcademicAnalyticsView);
  await effects();
  const failed = render(AdminAcademicAnalyticsView);
  assert.match(text(failed), /Storage unavailable/);
  assert.doesNotMatch(text(failed), /Total Downloads/);
});
