#!/usr/bin/env node

/**
 * Admin Password Hash Generator
 *
 * This script generates a bcrypt hash for the admin password.
 * The hash should be stored in your .env file as ADMIN_PASSWORD_HASH.
 *
 * Usage:
 *   node scripts/generate-admin-hash.js "YourSecurePassword"
 *   node scripts/generate-admin-hash.js  (will prompt for password)
 *
 * After generating the hash:
 * 1. Add to .env.local:
 *    ADMIN_PASSWORD_HASH=<generated_hash>
 * 2. Remove NEXT_PUBLIC_ADMIN_PASSWORD (if exists)
 * 3. Restart your dev server
 */

const bcrypt = require('bcryptjs');
const readline = require('readline');

const SALT_ROUNDS = 12;

async function generateHash(password) {
  if (!password || password.trim().length === 0) {
    console.error('❌ Password cannot be empty');
    process.exit(1);
  }

  if (password.length < 8) {
    console.warn('⚠️  Warning: Password is shorter than 8 characters');
  }

  console.log('\n🔐 Generating bcrypt hash...\n');

  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  console.log('✅ Hash generated successfully!\n');
  console.log('━'.repeat(80));
  console.log('\n📋 Add this to your .env.local file:\n');
  console.log(`ADMIN_PASSWORD_HASH="${hash}"\n`);
  console.log('━'.repeat(80));
  console.log('\n📝 Next steps:');
  console.log('  1. Copy the line above to .env.local');
  console.log('  2. Remove NEXT_PUBLIC_ADMIN_PASSWORD from .env (if exists)');
  console.log('  3. Restart your development server');
  console.log('  4. Never commit .env.local to git\n');
}

async function promptPassword() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter admin password: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  try {
    let password = process.argv[2];

    if (!password) {
      password = await promptPassword();
    }

    await generateHash(password);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
