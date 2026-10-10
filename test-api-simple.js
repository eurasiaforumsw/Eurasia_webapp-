/**
 * Simple API Test - Conversation Messages Endpoint
 * Tests basic functionality without requiring auth tokens
 */

const BASE_URL = 'http://localhost:2024';

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 ${name}`);
  console.log(`   URL: ${url}`);

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));

    return { response, data, success: response.ok };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error };
  }
}

async function runTests() {
  console.log('========================================');
  console.log('Conversation Messages API - Basic Tests');
  console.log('========================================');

  // Test 1: Unauthorized request
  await testEndpoint(
    'Test 1: GET without auth (should return 401)',
    `${BASE_URL}/api/messages/conversations/conv_test_001`
  );

  // Test 2: With mock bearer token
  await testEndpoint(
    'Test 2: GET with invalid token (should return 401)',
    `${BASE_URL}/api/messages/conversations/conv_test_001`,
    {
      headers: {
        'Authorization': 'Bearer fake_token_12345',
      },
    }
  );

  // Test 3: Check endpoint exists
  await testEndpoint(
    'Test 3: Check API route responds',
    `${BASE_URL}/api/messages/conversations/test`
  );

  console.log('\n========================================');
  console.log('Basic Tests Complete');
  console.log('========================================');
  console.log('\n📝 Next Steps:');
  console.log('1. Run the migration: supabase/migrations/012_create_messaging_system.sql');
  console.log('2. Execute test data setup: /tmp/setup-test-data.sql');
  console.log('3. Get a real auth token from your app');
  console.log('4. Update test-conversation-messages-api.js with real credentials');
  console.log('5. Run full test suite: node test-conversation-messages-api.js\n');
}

runTests().catch(console.error);
