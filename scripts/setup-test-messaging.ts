/**
 * Setup test data for messaging system
 * Run with: npx tsx scripts/setup-test-messaging.ts
 */

import { db } from '../lib/db';

const adminPasswordHash = process.env.TEST_ADMIN_PASSWORD_HASH;
const memberPasswordHash = process.env.TEST_MEMBER_PASSWORD_HASH;
if (!adminPasswordHash || !memberPasswordHash) {
  throw new Error('Set TEST_ADMIN_PASSWORD_HASH and TEST_MEMBER_PASSWORD_HASH before creating temporary data');
}

async function setupTestData() {
  console.log('🚀 Setting up test data for messaging system...\n');

  if (!db) {
    console.error('❌ Neon database is not configured');
    process.exit(1);
  }

  try {
    // 1. Create admin member if not exists
    console.log('👤 Creating admin member...');
    const { data: existingAdmin } = await db
      .from('members')
      .select('id')
      .eq('email', 'admin@efsw.local')
      .maybeSingle();

    let adminId: string;
    if (existingAdmin) {
      console.log('   ✅ Admin already exists:', existingAdmin.id);
      adminId = existingAdmin.id;
    } else {
      const { data: newAdmin, error: adminError } = await db
        .from('members')
        .insert({
          id: 'mem_admin',
          email: 'admin@efsw.local',
          full_name: 'Admin User',
          password_hash: adminPasswordHash,
          country: 'Thailand',
          membership_type: 'professional',
          organization: 'EFSW',
          position: 'Administrator',
          expertise: 'System Administration',
          university: 'N/A',
          faculty: 'N/A',
          degree: 'N/A',
          organization_type: 'N/A',
          contact_position: 'Administrator',
          bio: 'System administrator account',
          status: 'active',
          role: 'admin'
        })
        .select()
        .single();

      if (adminError) throw adminError;
      console.log('   ✅ Admin created:', newAdmin.id);
      adminId = newAdmin.id;
    }

    // 2. Create test member if not exists
    console.log('\n👤 Creating test member...');
    const { data: existingMember } = await db
      .from('members')
      .select('id')
      .eq('email', 'testmember@efsw.local')
      .maybeSingle();

    let memberId: string;
    if (existingMember) {
      console.log('   ✅ Test member already exists:', existingMember.id);
      memberId = existingMember.id;
    } else {
      const { data: newMember, error: memberError } = await db
        .from('members')
        .insert({
          id: 'mem_test001',
          email: 'testmember@efsw.local',
          full_name: 'Test Member',
          password_hash: memberPasswordHash,
          country: 'Thailand',
          membership_type: 'professional',
          organization: 'Test Organization',
          position: 'Member',
          expertise: 'Testing',
          university: 'Test University',
          faculty: 'Engineering',
          degree: 'Bachelor',
          organization_type: 'University',
          contact_position: 'Member',
          bio: 'Test member account for messaging system',
          status: 'active',
          role: 'member'
        })
        .select()
        .single();

      if (memberError) throw memberError;
      console.log('   ✅ Test member created:', newMember.id);
      memberId = newMember.id;
    }

    // 3. Create a test conversation
    console.log('\n💬 Creating test conversation...');
    const { data: conversation, error: convError } = await db
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (convError) throw convError;
    console.log('   ✅ Conversation created:', conversation.id);

    // 4. Add participants
    console.log('\n👥 Adding participants...');
    const { error: partError } = await db
      .from('conversation_participants')
      .insert([
        { conversation_id: conversation.id, member_id: adminId },
        { conversation_id: conversation.id, member_id: memberId }
      ]);

    if (partError) throw partError;
    console.log('   ✅ Participants added');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test data setup complete!');
    console.log('='.repeat(60));
    console.log('\nTest Accounts:');
    console.log('  Admin:');
    console.log('    Email: admin@efsw.local');
    console.log('    Password: value used to create TEST_ADMIN_PASSWORD_HASH');
    console.log('    ID:', adminId);
    console.log('\n  Member:');
    console.log('    Email: testmember@efsw.local');
    console.log('    Password: value used to create TEST_MEMBER_PASSWORD_HASH');
    console.log('    ID:', memberId);
    console.log('\nTest Conversation:');
    console.log('  ID:', conversation.id);
    console.log('  Participants:', adminId, '+', memberId);
    console.log('\n📝 Use this conversation ID for testing send message API\n');

    return { adminId, memberId, conversationId: conversation.id };

  } catch (error) {
    console.error('\n❌ Error setting up test data:', error);
    process.exit(1);
  }
}

setupTestData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
