import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestMember() {
  console.log('Creating test member...\n');

  const testMember = {
    id: 'member-test-001',
    full_name: 'Test Member',
    email: 'test.member@example.com',
    password_hash: 'hashed_password_here',
    role: 'member',
    membership_status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Check if member already exists
  const { data: existing } = await supabase
    .from('members')
    .select('id')
    .eq('id', testMember.id)
    .single();

  if (existing) {
    console.log('✅ Test member already exists:', testMember.id);
    return;
  }

  // Insert test member
  const { data, error } = await supabase
    .from('members')
    .insert(testMember)
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating test member:', error);
    return;
  }

  console.log('✅ Test member created successfully:');
  console.log(JSON.stringify(data, null, 2));
}

createTestMember().catch(console.error);
