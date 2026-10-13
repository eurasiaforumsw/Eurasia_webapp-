#!/usr/bin/env node
// Run after `next build`: node scripts/check-built-styles.cjs [path/to/.next]
// Client-reference manifests are generated JavaScript: use only our trusted builds.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const postcss = require('postcss');

const routes = [
  { route: '/', directory: '', key: '/page' },
  { route: '/academic-documents', directory: 'academic-documents', key: '/academic-documents/page' },
  { route: '/admin', directory: 'admin', key: '/admin/page' },
];

function canonicalSelector(selector) {
  return selector.trim().replace(/\s+/g, ' ')
    .replace(/\[([^\]=]+)=["']([^"']+)["']\]/g, '[$1=$2]');
}

function baseDeclarations(trees) {
  const selectors = new Map();
  for (const tree of trees) {
    tree.walkRules((rule) => {
      // Do not let a mobile/reduced-motion override hide a missing base rule.
      for (let parent = rule.parent; parent; parent = parent.parent) {
        if (parent.type === 'atrule' && /^(?:media|supports|container|document|.*keyframes)$/i.test(parent.name)) return;
      }
      for (const selector of rule.selectors) {
        const key = canonicalSelector(selector);
        if (!selectors.has(key)) selectors.set(key, new Map());
        for (const node of rule.nodes) {
          if (node.type === 'decl') selectors.get(key).set(node.prop, node.value);
        }
      }
    });
  }
  return selectors;
}

function checkBuiltStyles(buildDirectory) {
  const buildPath = path.resolve(buildDirectory);
  const parsedFiles = new Map();
  let checks = 0;

  for (const { route, directory, key } of routes) {
    const manifestPath = path.join(buildPath, 'server', 'app', directory, 'page_client-reference-manifest.js');
    const context = {};
    if (!fs.existsSync(manifestPath)) throw new Error(`${route}: client-reference manifest missing: ${manifestPath}`);
    vm.runInNewContext(fs.readFileSync(manifestPath, 'utf8'), context, { filename: manifestPath, timeout: 1000 });
    const manifest = context.__RSC_MANIFEST?.[key];
    if (!manifest?.entryCSSFiles || typeof manifest.entryCSSFiles !== 'object') {
      throw new Error(`${route}: manifest is missing entryCSSFiles`);
    }

    const references = [];
    for (const entries of Object.values(manifest.entryCSSFiles)) {
      if (!Array.isArray(entries)) throw new Error(`${route}: invalid CSS manifest entries`);
      for (const entry of entries) {
        // Next 14 emits strings; newer Next versions may use { path, inlined }.
        const reference = typeof entry === 'string' ? entry : entry?.path;
        if (typeof reference !== 'string' || !/^static\/[^?#]+\.css$/.test(reference)) {
          throw new Error(`${route}: invalid CSS reference in manifest`);
        }
        references.push(reference);
      }
    }
    const files = [...new Set(references)];
    if (!files.length) throw new Error(`${route}: manifest references no CSS files`);

    const trees = files.map((reference) => {
      const filename = path.resolve(buildPath, reference);
      if (!filename.startsWith(buildPath + path.sep)) throw new Error(`${route}: CSS reference escapes build directory`);
      if (!fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
        throw new Error(`${route}: referenced CSS missing: ${reference}`);
      }
      if (!parsedFiles.has(filename)) {
        parsedFiles.set(filename, postcss.parse(fs.readFileSync(filename, 'utf8'), { from: filename }));
      }
      return parsedFiles.get(filename);
    });
    const declarations = baseDeclarations(trees);
    const requireDeclaration = (selector, property, expected) => {
      checks += 1;
      const value = declarations.get(canonicalSelector(selector))?.get(property);
      const matches = typeof expected === 'function' ? expected(value || '')
        : expected instanceof RegExp ? expected.test(value || '')
          : expected === undefined ? Boolean(value)
            : value?.replace(/\s+/g, '') === expected.replace(/\s+/g, '');
      if (!matches) {
        throw new Error(`${route}: ${selector} requires ${property}${typeof expected === 'string' ? `: ${expected}` : ''}; found ${value ?? '(missing)'}`);
      }
    };

    // Real shared layout utilities and theme colors used by RootLayout and UI.
    requireDeclaration('body', 'margin', '0');
    requireDeclaration('body', 'font-family', /var\(--font-body\)/);
    requireDeclaration(':root', '--font-body');
    for (const [selector, property, value] of [
      ['.flex', 'display', 'flex'], ['.items-center', 'align-items', 'center'],
      ['.p-6', 'padding', '1.5rem'], ['.overflow-hidden', 'overflow', 'hidden'],
    ]) requireDeclaration(selector, property, value);
    requireDeclaration('.bg-surface-deep', 'background-color', /var\(--surface-deep\)/);
    requireDeclaration('.text-text-primary', 'color', /var\(--text-primary\)/);
    for (const theme of ['dark', 'light']) {
      for (const token of ['--surface-deep', '--surface-base', '--text-primary', '--text-secondary']) {
        requireDeclaration(`html[data-theme=${theme}]`, token, /^\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?$/);
      }
    }
    requireDeclaration('.efsw-nav', 'position', 'sticky');
    requireDeclaration('.efsw-nav', 'top', '0');
    requireDeclaration('.efsw-nav', 'z-index', (value) => Number(value) > 0);

    if (route === '/') {
      requireDeclaration('.efsw-home', 'background', /var\(--efsw-paper\)/);
      requireDeclaration('.efsw-home', 'color', /var\(--efsw-ink\)/);
      for (const selector of ['.efsw-about-bridge__grid', '.efsw-home-news__grid', '.efsw-footer__top']) {
        requireDeclaration(selector, 'display', 'grid');
        requireDeclaration(selector, 'grid-template-columns');
      }
    } else if (route === '/academic-documents') {
      requireDeclaration('.academic-library', 'background', /var\(--academic-paper\)/);
      requireDeclaration('.academic-library', '--academic-paper');
      requireDeclaration('.academic-grid', 'display', 'grid');
      requireDeclaration('.academic-grid', 'grid-template-columns', 'repeat(3, minmax(0, 1fr))');
      requireDeclaration('.academic-grid--list', 'grid-template-columns', '1fr');
      requireDeclaration('.document-card', 'display', 'flex');
      requireDeclaration('.sticky-filters', 'position', 'sticky');
      requireDeclaration('.author-marquee__track', 'display', 'flex');
      requireDeclaration('.author-marquee__track', 'animation', (value) => {
        const duration = value.match(/(?:^|\s)(\d*\.?\d+)(?:ms|s)(?=\s|$)/);
        return /(?:^|\s)academic-contributors-scroll(?:\s|$)/.test(value)
          && Boolean(duration && Number(duration[1]) > 0)
          && /(?:^|\s)infinite(?:\s|$)/.test(value);
      });
      requireDeclaration('.author-marquee__avatar', 'width', '148px');
      requireDeclaration('.author-marquee__avatar', 'height', '172px');
      requireDeclaration('.author-marquee__name', 'display', '-webkit-box');
      requireDeclaration('.author-marquee__name', '-webkit-line-clamp', '2');
      requireDeclaration('.author-marquee__name', '-webkit-box-orient', 'vertical');
      requireDeclaration('.author-marquee__name', 'overflow', 'hidden');
      requireDeclaration('.author-marquee.is-paused .author-marquee__track', 'animation-play-state', 'paused');
      if (!trees.some((tree) => {
        let present = false;
        tree.walkAtRules('keyframes', (rule) => {
          if (rule.params !== 'academic-contributors-scroll') return;
          rule.walkRules((step) => {
            if (!step.selectors.some((selector) => selector === 'to' || selector === '100%')) return;
            step.walkDecls('transform', (declaration) => {
              if (declaration.value.replace(/\s+/g, '') === 'translateX(-50%)') present = true;
            });
          });
        });
        return present;
      })) throw new Error(`${route}: academic-contributors-scroll keyframes require to/100% transform: translateX(-50%)`);
    } else {
      requireDeclaration('.admin-layout', 'display', 'grid');
      requireDeclaration('.admin-layout', 'grid-template-columns', '18rem 1fr');
      requireDeclaration('.admin-main', 'display', 'flex');
      requireDeclaration('.admin-main', 'min-width', '0');
      requireDeclaration('.admin-content', 'width', '100%');
      requireDeclaration('.efsw-admin-panel', 'background');
      requireDeclaration('.efsw-admin-panel', 'border');
    }
    console.log(`Built styles OK: ${route} (${files.length} referenced CSS files)`);
  }
  console.log(`Built styles passed: ${routes.length} routes, ${parsedFiles.size} CSS files, ${checks} declaration checks.`);
}

if (require.main === module) {
  try { checkBuiltStyles(process.argv[2] || '.next'); }
  catch (error) {
    console.error(`Built styles FAILED: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { checkBuiltStyles };
