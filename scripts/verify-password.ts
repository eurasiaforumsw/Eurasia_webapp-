/**
 * Verify password hash in database
 */

import { supabaseAdmin } from '../lib/supabase';
import * as bcrypt from 'bcryptjs';

async function verifyPassword() {
  console.log('🔐 Verifying password setup...\n');

  if (!supabaseAdmin) {
    console.error('❌ Supabase admin client not configured');
    process.exit(1);
  }

  try {
    // Get member from database
    const { data: member, error } = await supabaseAdmin
      .from('members')
      .select('id, email, password_hash')
      .eq('email', 'testmember@efsw.local')
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching member:', error);
      return;
    }

    if (!member) {
      console.log('❌ Member not found in database');
      return;
    }

    console.log('✅ Member found:', member.email);
    console.log('   ID:', member.id);
    console.log('   Hash in DB:', member.password_hash);

    // Test password
    const testPassword = 'test123';
    const isValid = await bcrypt.compare(testPassword, member.password_hash);

    console.log('\n🔑 Password test:');
    console.log('   Testing password:', testPassword);
    console.log('   Result:', isValid ? '✅ VALID' : '❌ INVALID');

    // Generate new hash
    const newHash = await bcrypt.hash(testPassword, 12);
    console.log('\n🔄 New hash for comparison:');
    console.log('   ', newHash);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

verifyPassword().catch(console.error);
