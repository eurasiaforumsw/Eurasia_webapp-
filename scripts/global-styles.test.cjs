const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');
const postcssImport = require('postcss-import');

const root = path.resolve(__dirname, '..');
const globalPath = path.join(root, 'app/globals.css');
const config = require(path.join(root, 'postcss.config.js'));
const plugins = Object.entries(config.plugins).map(([name, options]) => require(name)(
  name === 'tailwindcss' ? { ...options, config: path.join(root, 'tailwind.config.ts') } : options,
));

// Resolve the same local imports as Next's CSS loader, then run the project's
// configured PostCSS plugins. This checks generated CSS, not source line counts.
const compiled = postcss([postcssImport(), ...plugins]).process(
  fs.readFileSync(process.env.GLOBAL_STYLES_INPUT || globalPath, 'utf8'),
  { from: globalPath },
).then((result) => result.root);

function declarations(css, selector) {
  const values = new Map();
  css.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return;
    rule.walkDecls((declaration) => values.set(declaration.prop, declaration.value));
  });
  return values;
}

function usedBy(file, className) {
  assert.ok(fs.readFileSync(path.join(root, file), 'utf8').includes(className),
    `${className} must remain a real class used by ${file}`);
}

test('loaded global stylesheet defines fonts, page reset, and usable light/dark theme colors', async () => {
  assert.match(fs.readFileSync(path.join(root, 'app/layout.tsx'), 'utf8'), /import\s+["']\.\/globals\.css["']/);
  const css = await compiled;
  assert.ok(declarations(css, ':root').get('--font-body'), 'Global body font token is missing');
  const body = declarations(css, 'body');
  assert.equal(body.get('margin'), '0', 'Page reset is missing');
  assert.ok(body.get('font-family'), 'Global body typography is missing');
  for (const theme of ['dark', 'light']) {
    const values = declarations(css, `html[data-theme="${theme}"]`);
    for (const token of ['--surface-deep', '--surface-base', '--text-primary', '--text-secondary']) {
      assert.match(values.get(token) || '', /^\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?$/,
        `${theme} theme is missing RGB channels needed by Tailwind's ${token} colors`);
    }
  }
});

test('shared UI and root layout receive generated Tailwind layout, spacing, and color utilities', async () => {
  const css = await compiled;
  for (const [file, className, property, expected] of [
    ['components/ui/card.tsx', 'flex', 'display', 'flex'],
    ['components/ui/card.tsx', 'items-center', 'align-items', 'center'],
    ['components/ui/card.tsx', 'p-6', 'padding', '1.5rem'],
    ['components/ui/card.tsx', 'overflow-hidden', 'overflow', 'hidden'],
  ]) {
    usedBy(file, className);
    assert.equal(declarations(css, `.${className}`).get(property), expected,
      `${className} utility is missing from generated global CSS`);
  }
  for (const [className, property, token] of [
    ['bg-surface-deep', 'background-color', '--surface-deep'],
    ['text-text-primary', 'color', '--text-primary'],
  ]) {
    usedBy('app/layout.tsx', className);
    assert.ok(declarations(css, `.${className}`).get(property)?.includes(`var(${token})`),
      `${className} must resolve the application's theme token`);
  }
});

test('homepage sections and footer retain the layout and color rules used by the rendered page', async () => {
  const css = await compiled;
  usedBy('app/page.tsx', 'efsw-home');
  const home = declarations(css, '.efsw-home');
  assert.ok(home.get('background'), 'Homepage surface styling is missing');
  assert.ok(home.get('color'), 'Homepage text styling is missing');
  for (const className of ['efsw-about-bridge__grid', 'efsw-home-news__grid', 'efsw-footer__top']) {
    usedBy(className === 'efsw-footer__top' ? 'components/efsw/SiteFooter.tsx' : 'app/page.tsx', className);
    assert.equal(declarations(css, `.${className}`).get('display'), 'grid',
      `${className} layout is missing`);
  }
});

test('shared navigation retains positioning and responsive mobile controls', async () => {
  const css = await compiled;
  usedBy('components/efsw/SiteNav.tsx', 'efsw-nav');
  const nav = declarations(css, '.efsw-nav');
  assert.equal(nav.get('position'), 'sticky');
  assert.equal(nav.get('top'), '0');
  assert.ok(Number(nav.get('z-index')) > 0, 'Navigation must remain above page content');
  let responsive = false;
  css.walkAtRules('media', (media) => {
    if (!/width/.test(media.params)) return;
    media.walkRules((rule) => {
      if (rule.selector.includes('.efsw-nav__')) responsive = true;
    });
  });
  assert.ok(responsive, 'Navigation breakpoint rules are missing');
});
