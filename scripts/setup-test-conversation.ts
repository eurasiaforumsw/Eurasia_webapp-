/**
 * Setup test conversations for messaging system
 */

import 'dotenv/config';
import { db } from '../lib/db';

async function setupConversations() {
  console.log('💬 Setting up test conversations...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not configured');
    process.exitCode = 1;
    return;
  }

  try {
    // Get admin and test member IDs
    const { data: admin } = await db
      .from('members')
      .select('id, email, role')
      .eq('email', 'admin@efsw.local')
      .single();

    const { data: member } = await db
      .from('members')
      .select('id, email, role')
      .eq('email', 'testmember@efsw.local')
      .single();

    if (!admin || !member) {
      console.error('❌ Admin or test member not found');
      return;
    }

    console.log('✅ Found users:');
    console.log('   Admin:', admin.email, `(${admin.id})`);
    console.log('   Member:', member.email, `(${member.id})`);

    // Create test conversation
    console.log('\n📝 Creating test conversation...');

    // Delete existing test conversation if any
    await db
      .from('conversations')
      .delete()
      .eq('id', 'test-conv-1');

    const { data: conversation, error: convError } = await db
      .from('conversations')
      .insert({
        id: 'test-conv-1',
        title: 'Test Conversation',
        is_group: false,
        created_by: admin.id,
      })
      .select()
      .single();

    if (convError) {
      console.error('❌ Error creating conversation:', convError);
      return;
    }

    console.log('✅ Conversation created:', conversation.id);

    // Add participants
    console.log('\n👥 Adding participants...');

    // Delete existing participants
    await db
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', 'test-conv-1');

    const { error: participantsError } = await db
      .from('conversation_participants')
      .insert([
        {
          conversation_id: conversation.id,
          member_id: admin.id,
          role: 'admin',
        },
        {
          conversation_id: conversation.id,
          member_id: member.id,
          role: 'member',
        },
      ]);

    if (participantsError) {
      console.error('❌ Error adding participants:', participantsError);
      return;
    }

    console.log('✅ Participants added');

    // Verify
    const { data: participants } = await db
      .from('conversation_participants')
      .select('member_id, role')
      .eq('conversation_id', conversation.id);

    console.log('\n✅ Setup complete!');
    console.log('   Conversation ID:', conversation.id);
    console.log('   Participants:', participants?.length);
    console.log('\n🧪 You can now test with conversation_id: test-conv-1');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

setupConversations().catch(console.error);
