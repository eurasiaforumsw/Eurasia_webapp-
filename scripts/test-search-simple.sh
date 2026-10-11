#!/bin/bash

# Test Member Search Endpoint
# Run with: bash scripts/test-search-simple.sh

BASE_URL="http://localhost:2024"

echo "🧪 Testing Member Search Endpoint"
echo "============================================================"

# First, create a test member
echo ""
echo "1️⃣  Creating test member..."

CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/members" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "searchtest@efsw.local",
    "password": "SearchTest123!",
    "fullName": "Search Test Member",
    "country": "Thailand",
    "membershipType": "professional",
    "organization": "Test Organization",
    "position": "Developer",
    "expertise": "Software Development",
    "university": "",
    "faculty": "",
    "degree": "",
    "organizationType": "",
    "contactPosition": "",
    "bio": "Test member for search endpoint",
    "status": "active"
  }')

echo "Create response: $(echo $CREATE_RESPONSE | head -c 200)"

# Now login
echo ""
echo "2️⃣  Logging in to get test token..."

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/members/login" \
  -H "Content-Type: application/json" \
  -c /tmp/test-cookies.txt \
  -d '{
    "email": "searchtest@efsw.local",
    "password": "SearchTest123!"
  }')

echo "Login response: $(echo $LOGIN_RESPONSE | head -c 200)"

# Check if login was successful
if echo "$LOGIN_RESPONSE" | grep -q "success"; then
  echo "✅ Login successful"

  # Test 3: Search without authentication
  echo ""
  echo "3️⃣  Test: Search without authentication (should fail)"
  RESULT=$(curl -s -X GET "$BASE_URL/api/messages/members/search?q=test")
  echo "$RESULT"
  if echo "$RESULT" | grep -q "Authentication required"; then
    echo "✅ PASS - Correctly rejected unauthenticated request"
  else
    echo "❌ FAIL - Should require authentication"
  fi

  # Test 4: Search with authentication
  echo ""
  echo "4️⃣  Test: Search with authentication"
  RESULT=$(curl -s -X GET "$BASE_URL/api/messages/members/search?q=test" \
    -b /tmp/test-cookies.txt)
  echo "$RESULT"
  if echo "$RESULT" | grep -q "success"; then
    echo "✅ PASS - Search successful"
  else
    echo "❌ FAIL - Search should succeed"
  fi

  # Test 5: Search by email pattern
  echo ""
  echo "5️⃣  Test: Search by email pattern 'efsw'"
  RESULT=$(curl -s -X GET "$BASE_URL/api/messages/members/search?q=efsw" \
    -b /tmp/test-cookies.txt)
  echo "$RESULT" | head -c 500
  if echo "$RESULT" | grep -q "success"; then
    echo "✅ PASS - Email search successful"
  else
    echo "❌ FAIL - Email search should succeed"
  fi

  # Test 6: Empty query
  echo ""
  echo "6️⃣  Test: Empty query (should fail)"
  RESULT=$(curl -s -X GET "$BASE_URL/api/messages/members/search?q=" \
    -b /tmp/test-cookies.txt)
  echo "$RESULT"
  if echo "$RESULT" | grep -q "required"; then
    echo "✅ PASS - Correctly rejected empty query"
  else
    echo "❌ FAIL - Should reject empty query"
  fi

  # Test 7: Short query
  echo ""
  echo "7️⃣  Test: Short query 'a' (should fail)"
  RESULT=$(curl -s -X GET "$BASE_URL/api/messages/members/search?q=a" \
    -b /tmp/test-cookies.txt)
  echo "$RESULT"
  if echo "$RESULT" | grep -q "at least 2 characters"; then
    echo "✅ PASS - Correctly rejected short query"
  else
    echo "❌ FAIL - Should reject short query"
  fi

  # Test 8: Rate limiting (11 rapid requests)
  echo ""
  echo "8️⃣  Test: Rate limiting (11 rapid requests)"
  RATE_LIMITED=0
  for i in {1..11}; do
    RESULT=$(curl -s -X GET "$BASE_URL/api/messages/members/search?q=test$i" \
      -b /tmp/test-cookies.txt)
    if echo "$RESULT" | grep -q "Too many"; then
      echo "Request $i: Rate limited (429) ✅"
      RATE_LIMITED=1
      break
    else
      echo "Request $i: Success"
    fi
    sleep 0.1
  done

  if [ $RATE_LIMITED -eq 1 ]; then
    echo "✅ PASS - Rate limiting working"
  else
    echo "⚠️  WARNING - Rate limit not triggered (might need more requests)"
  fi

  echo ""
  echo "============================================================"
  echo "✅ Tests completed"
else
  echo "❌ Login failed"
  echo "Response: $LOGIN_RESPONSE"
fi

# Cleanup
rm -f /tmp/test-cookies.txt
