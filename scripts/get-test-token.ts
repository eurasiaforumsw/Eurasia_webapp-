/**
 * Script to get a valid member token for testing
 */

const BASE_URL = "http://localhost:2024";

async function getMemberToken() {
  console.log("🔑 Getting member token for testing...\n");

  // Try to login with a test member
  // You'll need to use actual credentials from your database
  const testCredentials = {
    email: process.env.TEST_EMAIL || "test@example.com",
    password: process.env.TEST_PASSWORD || "testpassword123",
  };

  console.log(`Attempting login with: ${testCredentials.email}`);

  try {
    const res = await fetch(`${BASE_URL}/api/auth/member/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testCredentials),
    });

    const setCookie = res.headers.get("set-cookie");
    const data = await res.json();

    console.log(`Status: ${res.status}`);

    if (res.status === 200 && setCookie) {
      // Extract token from Set-Cookie header
      const tokenMatch = setCookie.match(/member_token=([^;]+)/);
      if (tokenMatch) {
        const token = tokenMatch[1];
        console.log(`\n✅ Token obtained successfully!`);
        console.log(`\nExport this to run tests:`);
        console.log(`export TEST_MEMBER_TOKEN="${token}"`);
        console.log(`\nOr run tests with:`);
        console.log(`TEST_MEMBER_TOKEN="${token}" npx ts-node scripts/test-member-search.ts`);
        return token;
      }
    } else {
      console.log(`❌ Login failed:`, data);
      console.log(`\nPlease set correct credentials:`);
      console.log(`TEST_EMAIL="your@email.com" TEST_PASSWORD="yourpassword" npx ts-node scripts/get-test-token.ts`);
    }
  } catch (error) {
    console.error(`❌ Error:`, error);
  }
}

getMemberToken().catch(console.error);
