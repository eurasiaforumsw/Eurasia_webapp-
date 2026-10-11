/**
 * Create a test member account and get login token
 * This script will create a test member if it doesn't exist
 */

const BASE_URL = "http://localhost:2024";

async function setupTestMember() {
  console.log("🔧 Setting up test member account...\n");

  const testMember = {
    email: "testmember@efsw.local",
    password: "TestPassword123!",
    fullName: "Test Member",
    country: "Thailand",
    membershipType: "professional",
    organization: "EFSW Test Org",
    position: "Software Engineer",
    expertise: "Testing",
    university: "",
    faculty: "",
    degree: "",
    organizationType: "",
    contactPosition: "",
    bio: "Test member for API testing",
  };

  console.log("1️⃣  Creating test member account...");

  // Try to create member
  try {
    const registerRes = await fetch(`${BASE_URL}/api/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testMember),
    });

    const registerData = await registerRes.json();

    if (registerRes.status === 200) {
      console.log(`   ✅ Member created: ${registerData.member.id}`);
    } else if (registerRes.status === 409) {
      console.log(`   ℹ️  Member already exists`);
    } else {
      console.log(`   ⚠️  Unexpected response: ${registerRes.status}`, registerData);
    }
  } catch (error) {
    console.error(`   ❌ Error creating member:`, error);
  }

  console.log("\n2️⃣  Logging in...");

  // Now login to get token
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/member/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testMember.email,
        password: testMember.password,
      }),
    });

    const setCookie = loginRes.headers.get("set-cookie");
    const loginData = await loginRes.json();

    console.log(`   Status: ${loginRes.status}`);

    if (loginRes.status === 200 && setCookie) {
      const tokenMatch = setCookie.match(/member_token=([^;]+)/);
      if (tokenMatch) {
        const token = tokenMatch[1];
        console.log(`   ✅ Login successful!`);
        console.log(`\n${"=".repeat(60)}`);
        console.log(`\n📋 Test Member Credentials:`);
        console.log(`   Email: ${testMember.email}`);
        console.log(`   Password: ${testMember.password}`);
        console.log(`\n🔑 Token obtained!`);
        console.log(`\nRun search tests with:`);
        console.log(`TEST_MEMBER_TOKEN="${token}" npx ts-node scripts/test-member-search.ts`);
        console.log(`\n${"=".repeat(60)}\n`);
        return token;
      }
    } else {
      console.log(`   ❌ Login failed:`, loginData);
    }
  } catch (error) {
    console.error(`   ❌ Error logging in:`, error);
  }
}

setupTestMember().catch(console.error);
