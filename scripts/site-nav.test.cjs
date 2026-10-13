const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const load = Module._load;
let hooks;
Module._load = function (name, ...args) {
  if (name === 'react') return {
    ...load.call(this, name, ...args),
    useState(initial) {
      const index = hooks.cursor++;
      if (!(index in hooks.state)) hooks.state[index] = initial;
      return [hooks.state[index], (value) => {
        hooks.state[index] = typeof value === 'function' ? value(hooks.state[index]) : value;
      }];
    },
    useRef() { return { current: null }; },
    useCallback(callback) { return callback; },
    useEffect() {},
  };
  if (name === 'next/navigation') return { usePathname: () => '/academic-documents' };
  if (name === 'next/link') return { __esModule: true, default: 'a' };
  if (name === 'framer-motion') return { motion: (component) => component };
  if (name === '@/contexts/I18nContext') return {
    useI18n: () => ({ locale: 'en', setLocale() {}, t: (key) => key }),
  };
  if (name === '@/hooks/useClickOutside') return { useClickOutside() {} };
  if (name === '@/lib/admin-auth') return { ADMIN_SESSION_KEY: 'admin-session' };
  if (name === '@/lib/member-auth') return { MEMBER_SESSION_KEY: 'member-session' };
  if (name === '@/components/efsw/MemberMenu') return { MemberMenu() {} };
  return load.call(this, name, ...args);
};
require.extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(
  fs.readFileSync(filename, 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } },
).outputText, filename);

const { SiteNav } = require('../components/efsw/SiteNav.tsx');
function findElement(element, matches) {
  if (!element || typeof element !== 'object') return null;
  if (matches(element)) return element;
  for (const child of [].concat(element.props?.children || [])) {
    const found = findElement(child, matches);
    if (found) return found;
  }
  return null;
}

test('mobile navigation is inert while closed and becomes a modal only after opening', () => {
  hooks = { state: [], cursor: 0 };
  const render = () => { hooks.cursor = 0; return SiteNav(); };
  const sheet = (tree) => findElement(tree, (element) => element.props?.id === 'efsw-mobile-menu');
  const dialog = (tree) => findElement(tree, (element) => element.props?.role === 'dialog');
  const toggle = (tree) => findElement(tree, (element) => element.props?.['aria-controls'] === 'efsw-mobile-menu');
  const sheetElement = { inert: false };

  const closed = render();
  sheet(closed).ref?.(sheetElement);
  assert.equal(sheetElement.inert, true);
  assert.equal(sheet(closed).props['aria-hidden'], true);
  assert.equal(dialog(closed).props['aria-modal'], undefined);
  assert.equal(toggle(closed).props['aria-expanded'], false);

  global.window = { clearTimeout() {} };
  toggle(closed).props.onClick();
  const opened = render();
  sheet(opened).ref?.(sheetElement);
  assert.equal(sheetElement.inert, false);
  assert.equal(sheet(opened).props['aria-hidden'], false);
  assert.equal(dialog(opened).props['aria-modal'], true);
  assert.equal(toggle(opened).props['aria-expanded'], true);

  findElement(opened, (element) => element.props?.className === 'efsw-sheet__scrim').props.onClick();
  const dismissed = render();
  sheet(dismissed).ref?.(sheetElement);
  assert.equal(sheetElement.inert, true);
  assert.equal(sheet(dismissed).props['aria-hidden'], true);
  assert.equal(dialog(dismissed).props['aria-modal'], undefined);
});
