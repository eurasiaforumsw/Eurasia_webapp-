/**
 * Seed script for RBAC accounts
 * Creates 3 accounts with different roles:
 * 1. admin@efsw.local - admin role (full access)
 * 2. admin2@efsw.local - admin role (full access)
 * 3. news@efsw.local - pr role (content management only)
 */

import { db } from "../lib/db";
import * as bcrypt from "bcrypt";

if (!process.env.DATABASE_URL) {
  console.error("❌ Missing DATABASE_URL environment variable");
  process.exit(1);
}

// Password for all accounts (change in production)
const DEFAULT_PASSWORD = "EFSW-demo";

const ACCOUNTS = [
  {
    id: "admin-001",
    full_name: "EFSW Administrator",
    email: "admin@efsw.local",
    role: "admin",
    country: "Thailand",
    membership_type: "professional",
    organization: "Eurasia Foundation of Southeast Asia and the West",
    position: "System Administrator",
    expertise: "Administration, System Management",
    bio: "Primary administrator account with full access to all system features.",
    status: "active",
  },
  {
    id: "admin-002",
    full_name: "EFSW Administrator 2",
    email: "admin2@efsw.local",
    role: "admin",
    country: "Thailand",
    membership_type: "professional",
    organization: "Eurasia Foundation of Southeast Asia and the West",
    position: "System Administrator",
    expertise: "Administration, System Management",
    bio: "Secondary administrator account with full access to all system features.",
    status: "active",
  },
  {
    id: "pr-001",
    full_name: "EFSW Content Editor",
    email: "news@efsw.local",
    role: "pr",
    country: "Thailand",
    membership_type: "professional",
    organization: "Eurasia Foundation of Southeast Asia and the West",
    position: "Content Editor",
    expertise: "Content Management, Public Relations",
    bio: "Content editor account with access to News, Events, and Academic sections.",
    status: "active",
  },
];

async function seedAccounts() {
  console.log("🌱 Seeding RBAC accounts...\n");

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  console.log("🔐 Password hash generated\n");

  for (const account of ACCOUNTS) {
    console.log(`📝 Creating account: ${account.email}`);
    console.log(`   Role: ${account.role}`);
    console.log(`   Name: ${account.full_name}`);

    const record = {
      ...account,
      password_hash: passwordHash,
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      university: "",
      faculty: "",
      degree: "",
      organization_type: "",
      contact_position: "",
    };

    const { data, error } = await db
      .from("members")
      .upsert(record, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    } else {
      console.log(`   ✅ Created successfully`);
      console.log(`   ID: ${data.id}\n`);
    }
  }

  console.log("✨ Seeding complete!\n");
  console.log("📋 Summary:");
  console.log("   • 2 admin accounts (full access)");
  console.log("   • 1 pr account (content management only)");
  console.log(`   • Password for all accounts: ${DEFAULT_PASSWORD}`);
  console.log("\n🔐 Login credentials:");
  ACCOUNTS.forEach((acc) => {
    console.log(`   ${acc.email} / ${DEFAULT_PASSWORD} [${acc.role}]`);
  });
}

seedAccounts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("💥 Seed failed:", err);
    process.exit(1);
  });
