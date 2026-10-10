/**
 * Test script for /api/messages/send endpoint
 * Tests all validation steps as specified
 */

const BASE_URL = 'http://localhost:2024';

interface TestResult {
  testName: string;
  status: number;
  success: boolean;
  response: any;
}

const results: TestResult[] = [];

// Helper to make authenticated requests
async function testSendMessage(token: string | null, body: any, testName: string): Promise<TestResult> {
  console.log(`\n🧪 Test: ${testName}`);
  console.log(`   Body:`, JSON.stringify(body, null, 2));

  try {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Cookie'] = `member_token=${token}`;
    }

    const response = await fetch(`${BASE_URL}/api/messages/send`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));

    const result: TestResult = {
      testName,
      status: response.status,
      success: response.ok,
      response: data
    };

    results.push(result);
    return result;
  } catch (error: any) {
    console.error(`   ❌ Error:`, error.message);
    const result: TestResult = {
      testName,
      status: 500,
      success: false,
      response: { error: error.message }
    };
    results.push(result);
    return result;
  }
}

// Helper to login
async function login(email: string, password: string): Promise<string | null> {
  console.log(`🔐 Logging in as ${email}...`);
  const response = await fetch(`${BASE_URL}/api/members/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const cookies = response.headers.get('set-cookie');
  if (cookies) {
    const match = cookies.match(/member_token=([^;]+)/);
    if (match) {
      console.log('   ✅ Login successful');
      return match[1];
    }
  }

  console.log('   ❌ Login failed');
  return null;
}

// Helper to create conversation
async function createConversation(adminToken: string, participantIds: string[]): Promise<string | null> {
  console.log('\n💬 Creating test conversation...');
  const response = await fetch(`${BASE_URL}/api/messages/conversations/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `member_token=${adminToken}`
    },
    body: JSON.stringify({ participantIds })
  });

  const data = await response.json();
  if (data.conversation?.id) {
    console.log('   ✅ Conversation created:', data.conversation.id);
    return data.conversation.id;
  }

  console.log('   ❌ Failed to create conversation:', data);
  return null;
}

async function runTests() {
  console.log('🚀 Starting /api/messages/send API Tests\n');
  console.log('=' .repeat(60));

  const ADMIN_EMAIL = 'admin@efsw.local';
  const ADMIN_PASSWORD = 'EFSW-secure-admin-2024';
  const MEMBER_EMAIL = 'testmember@efsw.local';
  const MEMBER_PASSWORD = 'test123';

  let adminToken: string | null = null;
  let memberToken: string | null = null;
  let conversationId: string | null = null;
  let adminId = 'admin-seed-1'; // From existing data
  let memberId = 'mem_test001'; // From setup script

  try {
    // Login as admin
    adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    if (!adminToken) {
      console.error('❌ Cannot proceed without admin login');
      return;
    }

    // Login as member
    memberToken = await login(MEMBER_EMAIL, MEMBER_PASSWORD);
    if (!memberToken) {
      console.warn('⚠️  Member login failed, some tests will be skipped');
    }

    // Note: We need to create conversation manually via Supabase or use the conversation API
    // For now, we'll assume you already have a conversation ID from the setup
    // Replace this with actual conversation ID
    console.log('\n⚠️  NOTE: You need to provide a valid conversation ID');
    console.log('   Run: NEXT_PUBLIC_SUPABASE_URL=... npx tsx scripts/setup-test-messaging.ts');
    console.log('   Then use the conversation ID from that output\n');

    // Placeholder - replace with real conversation ID
    conversationId = 'conv_placeholder';

    console.log('\n' + '='.repeat(60));
    console.log('Starting validation tests...');
    console.log('='.repeat(60));

    // Test 1: No authentication
    await testSendMessage(null, {
      conversationId,
      content: 'Test message'
    }, '1. No authentication token (should fail with 401)');

    // Test 2: Empty content
    await testSendMessage(adminToken, {
      conversationId,
      content: ''
    }, '2. Empty message content (should fail with 400)');

    // Test 3: Content too long
    await testSendMessage(adminToken, {
      conversationId,
      content: 'A'.repeat(2001)
    }, '3. Message exceeds 2000 characters (should fail with 400)');

    // Test 4: Spam pattern detection
    await testSendMessage(adminToken, {
      conversationId,
      content: 'Click here to win a free casino prize! Buy viagra now!'
    }, '4. Message contains spam patterns (should fail with 400)');

    // Test 5: Member trying to send links (should fail)
    if (memberToken) {
      await testSendMessage(memberToken, {
        conversationId,
        content: 'Check this out https://example.com'
      }, '5. Member sending links (should fail with 403)');
    } else {
      console.log('\n⏭️  Skipped: Test 5 (member not logged in)');
    }

    // Test 6: Admin sending links (should succeed)
    await testSendMessage(adminToken, {
      conversationId,
      content: 'Check our website https://eurasia-forum.org'
    }, '6. Admin sending links (should succeed with 200)');

    // Test 7: Valid message
    await testSendMessage(adminToken, {
      conversationId,
      content: 'Hello, this is a valid test message'
    }, '7. Valid message #1 (should succeed with 200)');

    // Test 8: Rate limiting - send immediately after (should fail)
    await testSendMessage(adminToken, {
      conversationId,
      content: 'Immediate second message'
    }, '8. Rate limit test - too fast (should fail with 429)');

    // Test 9: Wait and send again
    console.log('\n⏳ Waiting 6 seconds for rate limit cooldown...');
    await new Promise(resolve => setTimeout(resolve, 6000));

    await testSendMessage(adminToken, {
      conversationId,
      content: 'Message after cooldown'
    }, '9. Message after rate limit cooldown (should succeed with 200)');

    // Test 10: Invalid conversation ID
    await testSendMessage(adminToken, {
      conversationId: 'invalid_conv_id',
      content: 'Test message'
    }, '10. Invalid conversation ID (should fail with 403)');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(60));

    let passed = 0;
    let failed = 0;

    results.forEach((result, index) => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.testName}`);
      console.log(`   Status: ${result.status} - ${result.response.error || result.response.message || 'Success'}`);

      if (result.success) passed++;
      else failed++;
    });

    console.log('\n' + '='.repeat(60));
    console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

// Run tests
runTests().catch(console.error);
