/**
 * Test script for Conversation Messages API
 * Tests: GET /api/messages/conversations/[id]
 *
 * Run: node test-conversation-messages-api.js
 */

const BASE_URL = 'http://localhost:3000';

// Test data - replace with real values from your database
const TEST_CONFIG = {
  // You'll need to get these from your Supabase dashboard
  VALID_CONVERSATION_ID: 'conv_xxxxx', // Replace with real conversation ID
  VALID_AUTH_TOKEN: 'your_auth_token_here', // Get from browser dev tools after login
  INVALID_CONVERSATION_ID: 'conv_invalid_12345',
  SUSPENDED_USER_TOKEN: 'suspended_user_token', // Optional: test suspended user
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(type, message) {
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
  };
  console.log(`${prefix[type]} ${message}`);
}

async function testEndpoint(name, url, options = {}) {
  console.log(`\n${colors.blue}Testing: ${name}${colors.reset}`);
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    return { response, data, success: response.ok };
  } catch (error) {
    log('error', `Request failed: ${error.message}`);
    return { success: false, error };
  }
}

async function runTests() {
  console.log(`${colors.blue}========================================`);
  console.log('Conversation Messages API Test Suite');
  console.log(`========================================${colors.reset}\n`);

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Unauthorized request (no token)
  {
    const result = await testEndpoint(
      'GET without auth token (should fail)',
      `${BASE_URL}/api/messages/conversations/${TEST_CONFIG.VALID_CONVERSATION_ID}`
    );
    if (result.response?.status === 401) {
      log('success', 'Correctly rejected unauthorized request');
      passedTests++;
    } else {
      log('error', 'Should have returned 401 Unauthorized');
      failedTests++;
    }
  }

  // Test 2: Get messages with valid auth
  {
    const result = await testEndpoint(
      'GET messages with valid auth',
      `${BASE_URL}/api/messages/conversations/${TEST_CONFIG.VALID_CONVERSATION_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.VALID_AUTH_TOKEN}`,
        },
      }
    );
    if (result.success && result.data.messages && result.data.pagination) {
      log('success', `Retrieved ${result.data.messages.length} messages`);
      log('info', `Has more: ${result.data.pagination.has_more}`);
      passedTests++;
    } else {
      log('error', 'Failed to retrieve messages or invalid response structure');
      failedTests++;
    }
  }

  // Test 3: Pagination - first page with limit
  {
    const result = await testEndpoint(
      'GET messages with pagination limit=10',
      `${BASE_URL}/api/messages/conversations/${TEST_CONFIG.VALID_CONVERSATION_ID}?limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.VALID_AUTH_TOKEN}`,
        },
      }
    );
    if (result.success && result.data.messages.length <= 10) {
      log('success', `Pagination working - returned ${result.data.messages.length} messages`);
      if (result.data.pagination.cursor) {
        log('info', `Next cursor: ${result.data.pagination.cursor}`);
      }
      passedTests++;
    } else {
      log('error', 'Pagination limit not respected');
      failedTests++;
    }
  }

  // Test 4: Pagination - second page with cursor
  {
    // First get first page to get cursor
    const firstPage = await fetch(
      `${BASE_URL}/api/messages/conversations/${TEST_CONFIG.VALID_CONVERSATION_ID}?limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.VALID_AUTH_TOKEN}`,
        },
      }
    );
    const firstData = await firstPage.json();

    if (firstData.pagination?.cursor) {
      const result = await testEndpoint(
        'GET messages with cursor (second page)',
        `${BASE_URL}/api/messages/conversations/${TEST_CONFIG.VALID_CONVERSATION_ID}?limit=5&cursor=${encodeURIComponent(firstData.pagination.cursor)}`,
        {
          headers: {
            'Authorization': `Bearer ${TEST_CONFIG.VALID_AUTH_TOKEN}`,
          },
        }
      );
      if (result.success) {
        log('success', 'Cursor-based pagination working');
        passedTests++;
      } else {
        log('error', 'Cursor-based pagination failed');
        failedTests++;
      }
    } else {
      log('warn', 'Skipping cursor test - not enough messages for pagination');
    }
  }

  // Test 5: Access non-existent conversation
  {
    const result = await testEndpoint(
      'GET messages for invalid conversation ID',
      `${BASE_URL}/api/messages/conversations/${TEST_CONFIG.INVALID_CONVERSATION_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.VALID_AUTH_TOKEN}`,
        },
      }
    );
    if (result.response?.status === 403 || result.response?.status === 404) {
      log('success', 'Correctly rejected access to invalid/unauthorized conversation');
      passedTests++;
    } else {
      log('error', 'Should have returned 403 or 404');
      failedTests++;
    }
  }

  // Test 6: Suspended user access (optional - only if you have test data)
  if (TEST_CONFIG.SUSPENDED_USER_TOKEN && TEST_CONFIG.SUSPENDED_USER_TOKEN !== 'suspended_user_token') {
    const result = await testEndpoint(
      'GET messages as suspended user',
      `${BASE_URL}/api/messages/conversations/${TEST_CONFIG.VALID_CONVERSATION_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.SUSPENDED_USER_TOKEN}`,
        },
      }
    );
    if (result.response?.status === 403 && result.data.suspension) {
      log('success', 'Correctly blocked suspended user');
      log('info', `Suspension reason: ${result.data.suspension.reason}`);
      passedTests++;
    } else {
      log('error', 'Should have blocked suspended user with 403');
      failedTests++;
    }
  } else {
    log('warn', 'Skipping suspended user test - no test token configured');
  }

  // Test 7: Verify message structure
  {
    const result = await testEndpoint(
      'Verify message data structure',
      `${BASE_URL}/api/messages/conversations/${TEST_CONFIG.VALID_CONVERSATION_ID}?limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.VALID_AUTH_TOKEN}`,
        },
      }
    );
    if (result.success && result.data.messages.length > 0) {
      const message = result.data.messages[0];
      const hasRequiredFields =
        message.id &&
        message.conversation_id &&
        message.sender_id &&
        message.content &&
        message.created_at &&
        message.sender &&
        message.sender.first_name &&
        message.sender.last_name;

      if (hasRequiredFields) {
        log('success', 'Message structure is correct');
        log('info', `Sample: ${message.sender.first_name} ${message.sender.last_name}: ${message.content.substring(0, 50)}...`);
        passedTests++;
      } else {
        log('error', 'Message structure missing required fields');
        console.log('Message:', message);
        failedTests++;
      }
    } else {
      log('warn', 'Skipping structure test - no messages available');
    }
  }

  // Summary
  console.log(`\n${colors.blue}========================================`);
  console.log('Test Summary');
  console.log(`========================================${colors.reset}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`Total: ${passedTests + failedTests}\n`);

  if (failedTests === 0) {
    log('success', 'All tests passed! 🎉');
  } else {
    log('error', `${failedTests} test(s) failed`);
  }

  // Setup instructions
  console.log(`\n${colors.yellow}========================================`);
  console.log('Setup Instructions');
  console.log(`========================================${colors.reset}`);
  console.log('1. Start your dev server: npm run dev');
  console.log('2. Create test data in Supabase:');
  console.log('   - Create a conversation');
  console.log('   - Add participants');
  console.log('   - Add some test messages');
  console.log('3. Get your auth token:');
  console.log('   - Login to your app');
  console.log('   - Open browser DevTools > Application > Cookies');
  console.log('   - Copy the auth token value');
  console.log('4. Update TEST_CONFIG in this file');
  console.log('5. Run: node test-conversation-messages-api.js\n');
}

// Run tests
runTests().catch(console.error);
