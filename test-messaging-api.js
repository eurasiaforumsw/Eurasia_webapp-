#!/usr/bin/env node

/**
 * Integration test for messaging system API endpoints
 * Run: node test-messaging-api.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Test credentials (use real credentials or create test accounts)
const TEST_MEMBER_1 = {
  email: 'test1@example.com',
  password: 'TestPassword123!'
};

const TEST_MEMBER_2 = {
  email: 'test2@example.com',
  password: 'TestPassword123!'
};

const TEST_ADMIN = {
  email: 'admin@efsw.local',
  password: 'admin123'
};

let member1Token = '';
let member2Token = '';
let adminToken = '';
let conversationId = '';

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`\n→ ${options.method || 'GET'} ${endpoint}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  console.log(`← Status: ${response.status}`);
  console.log(`← Response:`, JSON.stringify(data, null, 2));

  return { status: response.status, data, headers: response.headers };
}

// Test 1: Login as member 1
async function testLoginMember1() {
  console.log('\n========== TEST 1: Login Member 1 ==========');
  const { status, data, headers } = await apiRequest('/api/members/login', {
    method: 'POST',
    body: JSON.stringify(TEST_MEMBER_1),
  });

  if (status === 200 && data.success) {
    // Extract token from Set-Cookie header
    const cookies = headers.get('set-cookie');
    if (cookies) {
      const match = cookies.match(/member_token=([^;]+)/);
      if (match) {
        member1Token = match[1];
        console.log('✓ Member 1 logged in successfully');
      }
    }
  } else {
    console.log('✗ Member 1 login failed');
  }
}

// Test 2: Login as member 2
async function testLoginMember2() {
  console.log('\n========== TEST 2: Login Member 2 ==========');
  const { status, data, headers } = await apiRequest('/api/members/login', {
    method: 'POST',
    body: JSON.stringify(TEST_MEMBER_2),
  });

  if (status === 200 && data.success) {
    const cookies = headers.get('set-cookie');
    if (cookies) {
      const match = cookies.match(/member_token=([^;]+)/);
      if (match) {
        member2Token = match[1];
        console.log('✓ Member 2 logged in successfully');
      }
    }
  } else {
    console.log('✗ Member 2 login failed');
  }
}

// Test 3: Login as admin
async function testLoginAdmin() {
  console.log('\n========== TEST 3: Login Admin ==========');
  const { status, data, headers } = await apiRequest('/api/members/login', {
    method: 'POST',
    body: JSON.stringify(TEST_ADMIN),
  });

  if (status === 200 && data.success) {
    const cookies = headers.get('set-cookie');
    if (cookies) {
      const match = cookies.match(/member_token=([^;]+)/);
      if (match) {
        adminToken = match[1];
        console.log('✓ Admin logged in successfully');
      }
    }
  } else {
    console.log('✗ Admin login failed');
  }
}

// Test 4: Create conversation (unauthorized)
async function testCreateConversationUnauthorized() {
  console.log('\n========== TEST 4: Create Conversation (Unauthorized) ==========');
  const { status } = await apiRequest('/api/messages/conversations', {
    method: 'POST',
    body: JSON.stringify({ recipientMemberId: 'some-member-id' }),
  });

  if (status === 401) {
    console.log('✓ Correctly rejected unauthorized request');
  } else {
    console.log('✗ Should have rejected unauthorized request');
  }
}

// Test 5: Get conversations (empty list)
async function testGetConversationsEmpty() {
  console.log('\n========== TEST 5: Get Conversations (Empty) ==========');
  const { status, data } = await apiRequest('/api/messages/conversations', {
    headers: { Cookie: `member_token=${member1Token}` },
  });

  if (status === 200 && Array.isArray(data.conversations)) {
    console.log(`✓ Got conversations list (${data.conversations.length} items)`);
  } else {
    console.log('✗ Failed to get conversations');
  }
}

// Test 6: Create conversation between member 1 and member 2
async function testCreateConversation() {
  console.log('\n========== TEST 6: Create Conversation ==========');
  // First get member 2 ID
  // This requires knowing the member ID - in production you'd search for the member first
  console.log('⚠ Skipping: Requires knowing member IDs from database');
}

// Test 7: Send message (rate limit test)
async function testRateLimit() {
  console.log('\n========== TEST 7: Rate Limit Test ==========');
  console.log('⚠ Skipping: Requires existing conversation');
}

// Test 8: Suspend member (admin only)
async function testSuspendMember() {
  console.log('\n========== TEST 8: Suspend Member (Admin) ==========');
  console.log('⚠ Skipping: Requires knowing member IDs from database');
}

// Test 9: Send message while suspended
async function testSendWhileSuspended() {
  console.log('\n========== TEST 9: Send Message While Suspended ==========');
  console.log('⚠ Skipping: Requires suspended member account');
}

// Test 10: Lift suspension
async function testLiftSuspension() {
  console.log('\n========== TEST 10: Lift Suspension ==========');
  console.log('⚠ Skipping: Requires knowing member IDs from database');
}

// Run all tests
async function runTests() {
  console.log('===========================================');
  console.log('  MESSAGING SYSTEM API INTEGRATION TEST  ');
  console.log('===========================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('\nNote: Some tests require database setup with test accounts');
  console.log('Create test accounts first:');
  console.log('  - test1@example.com / TestPassword123!');
  console.log('  - test2@example.com / TestPassword123!');
  console.log('  - admin@efsw.local / admin123 (with role=admin)');

  try {
    await testCreateConversationUnauthorized();
    await testLoginMember1();
    await testLoginMember2();
    await testLoginAdmin();
    await testGetConversationsEmpty();
    await testCreateConversation();
    await testRateLimit();
    await testSuspendMember();
    await testSendWhileSuspended();
    await testLiftSuspension();

    console.log('\n===========================================');
    console.log('  TESTS COMPLETED');
    console.log('===========================================');
  } catch (error) {
    console.error('\n✗ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
