const assert = require("node:assert/strict");
const { test, beforeEach } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const load = Module._load;
const resolve = Module._resolveFilename;
const notFoundError = new Error("NEXT_NOT_FOUND");
const requests = [];
let items = [];
let responseStatus = 200;
let publicHandlerImports = 0;
let localHookHarness = null;
let localItems = [];

Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith("@/") ? path.join(root, name.slice(2)) : name, ...args);
};
Module._load = function (name, ...args) {
  if (name === "react") {
    return { ...load.call(this, name, ...args), cache: (fn) => fn,
      ...(localHookHarness ? {
        useState: (initial) => {
          const index = localHookHarness.cursor++;
          if (!(index in localHookHarness.state)) localHookHarness.state[index] = initial;
          return [localHookHarness.state[index], (value) => { localHookHarness.state[index] = value; }];
        },
        useEffect: (effect) => { if (!localHookHarness.mounted) localHookHarness.effects.push(effect); },
      } : {}),
    };
  }
  if (name === "next/navigation") return { notFound: () => { throw notFoundError; } };
  if (name === "next/headers") return { headers: () => new Headers({ cookie: "member_token=test-member-session" }) };
  if (name === "@/components/efsw/ArticleView") return { __esModule: true, default: function ArticleView() {} };
  if (name === "@/components/academic/LocalDocumentView") return { __esModule: true, default: function LocalDocumentView() {} };
  if (name === "@/components/efsw/SiteNav") return { SiteNav: function SiteNav() {} };
  if (name === "@/lib/admin-data" && localHookHarness) return { ADMIN_CONTENT_KEY: "content", getAdminContent: () => localItems };
  if (name === "@/app/api/content/public/route") {
    publicHandlerImports += 1;
    return {
      GET: async (req) => {
        requests.push(new URL(req.url));
        return Response.json({ items }, { status: responseStatus });
      },
    };
  }
  if (name.endsWith(".css")) return {};
  return load.call(this, name, ...args);
};
for (const extension of [".ts", ".tsx"]) {
  require.extensions[extension] = (module, filename) => {
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
    module._compile(source, filename);
  };
}

const page = require("../app/academic-documents/[slug]/page.tsx");
const { articleBodyText } = require("../lib/article-body.ts");
const academic = {
  id: "academic-new-paper",
  kind: "academic",
  category: "Research Papers",
  title: "A newly published paper",
  summary: "Published by an administrator after deployment.",
  body: "The full research paper summary.",
  status: "published",
  locale: "en",
  updatedAt: "2026-10-12T00:00:00.000Z",
  fileUrl: "https://media.example.invalid/paper.pdf",
  fileName: "paper.pdf",
  seoTitle: "Research publication",
  seoDescription: "Publication search description",
  ogImage: "https://media.example.invalid/paper.webp",
};

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://detail-test.example.invalid";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "detail-test-anon-key";
  items = [academic];
  requests.length = 0;
  responseStatus = 200;
  publicHandlerImports = 0;
});

test("a newly published academic entry opens with authoritative content and its attachment", async () => {
  const rendered = await page.default({ params: { slug: academic.id } });
  assert.equal(rendered.props.seed.title, academic.title);
  assert.equal(rendered.props.seed.fileUrl, academic.fileUrl);
  assert.equal(rendered.props.kind, "academic");
  assert.equal(rendered.props.contentSource, "public");
  assert.equal(requests[0].searchParams.get("slug"), academic.id);
});

test("legacy document entries use the same public detail route", async () => {
  const legacy = { ...academic, id: "legacy-document", kind: "document" };
  items = [legacy];
  const rendered = await page.default({ params: { slug: legacy.id } });
  assert.equal(rendered.props.kind, "document");
  assert.equal(rendered.props.seed.id, legacy.id);
});

test("metadata follows the persisted academic entry and its SEO fields", async () => {
  const metadata = await page.generateMetadata({ params: { slug: academic.id } });
  assert.equal(metadata.title, `${academic.seoTitle} | EFSW Academic Documents`);
  assert.equal(metadata.description, academic.seoDescription);
  assert.deepEqual(metadata.openGraph.images, [academic.ogImage]);
  assert.deepEqual(metadata.twitter.images, [academic.ogImage]);
});

test("relative cover images resolve against the public site for social previews", async () => {
  const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  items = [{ ...academic, ogImage: undefined, coverImage: "/uploads/research-cover.webp" }];
  try {
    for (const siteUrl of ["https://documents.example.invalid", undefined]) {
      if (siteUrl) process.env.NEXT_PUBLIC_SITE_URL = siteUrl;
      else delete process.env.NEXT_PUBLIC_SITE_URL;
      const metadata = await page.generateMetadata({ params: { slug: academic.id } });
      const origin = siteUrl || "https://eurasiaforumsw.org";
      assert.equal(metadata.metadataBase.origin, origin);
      assert.equal(new URL(metadata.openGraph.images[0], metadata.metadataBase).href, `${origin}/uploads/research-cover.webp`);
      assert.equal(new URL(metadata.twitter.images[0], metadata.metadataBase).href, `${origin}/uploads/research-cover.webp`);
    }
  } finally {
    if (previousSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl;
  }
});

test("direct document links resolve the matching record and share metadata keeps special IDs intact", async () => {
  const second = { ...academic, id: "paper #2?ภาษาไทย/guide", title: "A different paper", fileUrl: "/second.pdf" };
  items = [academic, second];
  const firstPage = await page.default({ params: { slug: academic.id } });
  const secondPage = await page.default({ params: { slug: second.id } });
  assert.equal(firstPage.props.seed.id, academic.id);
  assert.equal(secondPage.props.seed.id, second.id);
  assert.equal(secondPage.props.seed.title, second.title);
  assert.equal(secondPage.props.seed.fileUrl, second.fileUrl);
  assert.notEqual(firstPage.key, secondPage.key);

  const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://documents.example.invalid";
  try {
    const metadata = await page.generateMetadata({ params: { slug: second.id } });
    const shared = new URL(metadata.openGraph.url);
    assert.equal(shared.origin, "https://documents.example.invalid");
    assert.equal(decodeURIComponent(shared.pathname.split("/").at(-1)), second.id);
    assert.equal(shared.search, "");
    assert.equal(shared.hash, "");
    assert.equal(metadata.alternates.canonical, shared.href);

    items = [{ ...second, canonicalUrl: "https://publisher.example.invalid/original" }];
    const original = await page.generateMetadata({ params: { slug: second.id } });
    assert.equal(original.alternates.canonical, "https://publisher.example.invalid/original");
    assert.equal(original.openGraph.url, shared.href);
  } finally {
    if (previousSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl;
  }
});

test("deleted or hidden records never fall back to bundled content", async () => {
  items = [];
  await assert.rejects(async () => page.default({ params: { slug: "document-research" } }), (error) => error === notFoundError);
  const metadata = await page.generateMetadata({ params: { slug: "document-research" } });
  assert.equal(metadata.title, "Document not found | EFSW");
});

test("news and event IDs cannot be opened as academic documents", async () => {
  items = [{ ...academic, kind: "news" }];
  await assert.rejects(async () => page.default({ params: { slug: academic.id } }), (error) => error === notFoundError);
});

test("public API failures surface as load errors rather than a false missing document", async () => {
  responseStatus = 500;
  await assert.rejects(page.default({ params: { slug: academic.id } }), /Failed to load academic document/);
});

test("missing legacy Supabase variables still resolves persisted Neon content", async () => {
  for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]) {
    const saved = process.env[key];
    delete process.env[key];
    const rendered = await page.default({ params: { slug: academic.id } });
    assert.equal(rendered.type.name, "ArticleView");
    assert.equal(rendered.props.slug, academic.id);
    assert.equal(rendered.props.seed.id, academic.id);
    const metadata = await page.generateMetadata({ params: { slug: academic.id } });
    assert.equal(metadata.title, `${academic.seoTitle} | EFSW Academic Documents`);
    assert.ok(requests.length > 0);
    assert.ok(publicHandlerImports > 0);
    process.env[key] = saved;
  }
});

test("local details resolve saved academic records and update to missing after deletion", () => {
  const windowSaved = global.window;
  const listeners = new Map();
  global.window = {
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
    document: { visibilityState: "visible", addEventListener() {}, removeEventListener() {} },
  };
  localHookHarness = { state: [], cursor: 0, effects: [], mounted: false };
  localItems = [academic];
  try {
    const LocalDocumentView = require("../components/academic/LocalDocumentView.tsx").default;
    const render = () => { localHookHarness.cursor = 0; return LocalDocumentView({ slug: academic.id }); };
    const loading = render();
    assert.equal(loading.props.children[1].props.children.props.className, "academic-document-detail__loading");
    const cleanups = localHookHarness.effects.map((effect) => effect());
    localHookHarness.mounted = true;
    const loaded = render();
    assert.equal(loaded.props.seed.title, academic.title);
    assert.equal(loaded.props.contentSource, "local-library");
    localItems = [];
    listeners.get("storage")({ key: "content" });
    const missing = render();
    assert.equal(missing.props.children[1].props.children.props.className, "academic-document-detail__missing");
    localItems = [{ ...academic, status: "draft" }];
    listeners.get("efsw:content-changed")();
    assert.equal(render().props.children[1].props.children.props.className, "academic-document-detail__missing");
    cleanups.forEach((cleanup) => cleanup?.());
  } finally {
    global.window = windowSaved;
    localHookHarness = null;
  }
});

test("editor HTML becomes readable paragraphs and lists rather than literal tags", () => {
  const body = '<h2>Research &amp; practice</h2><p>One&nbsp;community &#8212; shared knowledge.</p><ul><li>First topic</li><li>Second <strong>topic</strong></li></ul>';
  assert.equal(articleBodyText(body), "Research & practice\n\nOne community — shared knowledge.\n\n- First topic\n- Second topic");
  assert.equal(articleBodyText("Plain text\n\n- A topic"), "Plain text\n\n- A topic");
});

test("executable markup is discarded and decoded markup stays plain text", () => {
  assert.equal(articleBodyText('<p>Safe text</p><script>alert(1)</script><style>body {color:red}</style><p>&lt;img src=x onerror=alert(1)&gt;</p>'), "Safe text\n\n<img src=x onerror=alert(1)>");
});
