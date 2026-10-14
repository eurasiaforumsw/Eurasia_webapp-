const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('generated admin hash survives Next.js environment loading and validates the password', () => {
  const password = 'admin-hash-generator-test-password';
  const generated = spawnSync(process.execPath, [path.join(__dirname, 'generate-admin-hash.js'), password], {
    encoding: 'utf8',
    env: { NODE_ENV: 'development' },
    timeout: 15000,
  });
  assert.equal(generated.status, 0, 'Password hash generator should exit successfully');
  const assignment = generated.stdout.match(/^ADMIN_PASSWORD_HASH="([^"]+)"$/m);
  assert.ok(assignment, 'Generator should emit a quoted environment assignment');
  const expectedHash = assignment[1].replace(/\\\$/g, '$');
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'admin-hash-generator-'));

  try {
    fs.writeFileSync(path.join(fixture, '.env.local'), `${assignment[0]}\n`);
    // Load only the temporary fixture in a child, so project secrets stay untouched.
    const loaded = spawnSync(process.execPath, ['-e', `
      const fs = require('node:fs');
      const { loadEnvConfig } = require(${JSON.stringify(require.resolve('@next/env'))});
      const bcrypt = require(${JSON.stringify(require.resolve('bcryptjs'))});
      const input = JSON.parse(fs.readFileSync(0, 'utf8'));
      loadEnvConfig(process.argv[1], true, { info() {}, error() {} });
      const hash = process.env.ADMIN_PASSWORD_HASH || '';
      Promise.all([
        bcrypt.compare(input.password, hash),
        bcrypt.compare(input.password + '-incorrect', hash),
      ]).then(([correctPassword, wrongPassword]) => {
        process.stdout.write(JSON.stringify({
          matchesOriginalHash: hash === input.expectedHash,
          validBcrypt: /^\\$2[aby]\\$12\\$[A-Za-z0-9./]{53}$/.test(hash),
          correctPassword,
          wrongPassword,
        }));
      }).catch(() => process.exit(1));
    `, fixture], {
      encoding: 'utf8',
      env: { NODE_ENV: 'development' },
      input: JSON.stringify({ password, expectedHash }),
      timeout: 15000,
    });
    assert.equal(loaded.status, 0, 'Isolated Next.js environment loader should exit successfully');
    const result = JSON.parse(loaded.stdout);
    assert.equal(result.matchesOriginalHash, true, 'Next.js should preserve every character of the generated hash');
    assert.equal(result.validBcrypt, true, 'Loaded hash should remain valid bcrypt');
    assert.equal(result.correctPassword, true, 'Loaded hash should accept the original password');
    assert.equal(result.wrongPassword, false, 'Loaded hash should reject an incorrect password');
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
