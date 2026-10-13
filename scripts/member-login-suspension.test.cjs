const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const resolve = Module._resolveFilename;
const load = Module._load;
Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith("@/") ? path.join(root, name.slice(2)) : name, ...args);
};
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
Module._load = function (name, ...args) {
  if (name === "bcrypt") return { compare: async (password) => password === "valid-password" };
  return load.call(this, name, ...args);
};

process.env.JWT_SECRET = "login-expiry-test-0123456789abcdef0123456789";
let suspensions = [];
let expiryStatus = "active";
let lookupError = null;
const calls = [];
const database = {
  from(table) {
    const result = () => table === "members" ? { data: { id: "member-one", full_name: "Member One", email: "one@example.com",
      password_hash: "hash", status: "suspended", role: "member" }, error: null }
      : { data: suspensions, error: lookupError };
    const query = { select() { calls.push(["read", table]); return query; }, eq() { return query; },
      maybeSingle() { return Promise.resolve(result()); }, then(yes, no) { return Promise.resolve(result()).then(yes, no); } };
    return query;
  },
  async rpc(name, args) { calls.push([name, args]); return { data: expiryStatus, error: null }; },
};
require.cache[path.join(root, "lib/supabase.ts")] = { exports: { supabaseAdmin: database } };
require.cache[path.join(root, "lib/security/rate-limit.ts")] = { exports: { consumeRateLimit: async () => ({ allowed: true }) } };
const { NextRequest } = require("next/server");
const login = require("../app/api/members/login/route.ts");
function request(password = "valid-password") {
  return new NextRequest("http://localhost:2024/api/members/login", { method: "POST",
    headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "one@example.com", password }) });
}

const { isActiveSuspension } = require("../lib/member-status.ts");
const now = Date.parse("2026-10-13T00:00:00.000Z");
test("expired temporary suspensions no longer block login while permanent bans do", () => {
  assert.equal(isActiveSuspension({ is_active: true, expires_at: "2026-10-12T23:59:59.000Z" }, now), false);
  assert.equal(isActiveSuspension({ is_active: true, expires_at: "2026-10-13T00:00:01.000Z" }, now), true);
  assert.equal(isActiveSuspension({ is_active: true, expires_at: null }, now), true);
  assert.equal(isActiveSuspension({ is_active: false, expires_at: null }, now), false);
});

test("member login resolves an expired temporary ban atomically before issuing a token", async () => {
  suspensions = [{ is_active: true, expires_at: "2000-01-01T00:00:00Z" }];
  expiryStatus = "active";
  calls.length = 0;
  const response = await login.POST(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).member.status, "active");
  assert.match(response.headers.get("set-cookie"), /member_token=/);
  assert.deepEqual(calls.find(([name]) => name === "expire_member_suspensions"), ["expire_member_suspensions", { p_member_id: "member-one" }]);
});

test("permanent, unexpired and manual account bans remain blocked without expiring them", async () => {
  for (const records of [[{ is_active: true, expires_at: null }],
    [{ is_active: true, expires_at: "2099-01-01T00:00:00Z" }], [],
    [{ is_active: true, expires_at: "invalid" }]]) {
    suspensions = records;
    calls.length = 0;
    const response = await login.POST(request());
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal(calls.some(([name]) => name === "expire_member_suspensions"), false);
  }
});

test("a permanent ban created during expiry resolution stays blocked", async () => {
  suspensions = [{ is_active: true, expires_at: "2000-01-01T00:00:00Z" }];
  expiryStatus = "suspended";
  const response = await login.POST(request());
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("set-cookie"), null);
});

test("failed suspension checks and invalid passwords never issue a session", async () => {
  lookupError = { message: "Database unavailable" };
  assert.equal((await login.POST(request())).status, 500);
  lookupError = null;
  calls.length = 0;
  assert.equal((await login.POST(request("wrong-password"))).status, 401);
  assert.equal(calls.some(([name]) => name === "expire_member_suspensions"), false);
});
