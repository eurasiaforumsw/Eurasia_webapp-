/**
 * Update member password hash
 */

import 'dotenv/config';
import { db } from '../lib/db';
import * as bcrypt from 'bcryptjs';

async function updatePassword() {
  console.log('🔄 Updating password hash...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not configured');
    process.exitCode = 1;
    return;
  }

  try {
    const testPassword = 'test123';
    const newHash = await bcrypt.hash(testPassword, 12);

    console.log('Generated new hash:', newHash);

    // Update password hash
    const { error } = await db
      .from('members')
      .update({ password_hash: newHash })
      .eq('email', 'testmember@efsw.local');

    if (error) {
      console.error('❌ Error updating password:', error);
      return;
    }

    console.log('✅ Password hash updated successfully');

    // Verify it works
    const { data: member } = await db
      .from('members')
      .select('password_hash')
      .eq('email', 'testmember@efsw.local')
      .single();

    if (member) {
      const isValid = await bcrypt.compare(testPassword, member.password_hash);
      console.log('✅ Verification:', isValid ? 'Password works!' : 'Password failed');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

updatePassword().catch(console.error);
