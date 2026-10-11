# Messaging System API - Setup and Testing Guide

## 📋 Overview

API endpoint `/api/messages/send` has been created with complete validation:

### ✅ Validation Steps (All Implemented)

1. **Check sender suspension** - Blocks suspended members
2. **Verify participant** - Ensures sender is part of conversation
3. **Rate limiting** - 5s base delay, escalates to 15m for violations
4. **Link detection** - Only admins can send links
5. **Content moderation** - Profanity/spam filter
6. **Message expiration** - Auto-delete after 180 days
7. **Conversation metadata** - Updates last message preview
8. **Rate limit tracking** - Records attempts for anti-spam

---

## 🗄️ Database Schema Required

The following 5 tables must be created:

### 1. `conversations`
- id, title, is_group, created_by
- created_at, last_message_at, last_message_preview

### 2. `conversation_participants`
- id, conversation_id, member_id, role, joined_at
- UNIQUE(conversation_id, member_id)

### 3. `messages`
- id, conversation_id, sender_id, content
- created_at, expires_at, is_deleted, deleted_at

### 4. `message_rate_limits`
- id, member_id, last_attempt_at
- current_delay_seconds, violation_count, last_success_at

### 5. `member_suspensions`
- id, member_id, reason, reason_details
- suspended_by, suspended_at, expires_at, is_active

---

## 🚀 Setup Instructions

### Step 1: Apply Database Migration

**Option A: Via Supabase Dashboard (Recommended)**

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project
3. Go to **SQL Editor**
4. Create new query
5. Copy entire content from: `supabase/migrations/012_create_messaging_system.sql`
6. Paste and click **Run**
7. Verify: Run `npx tsx scripts/check-messaging-tables.ts`

**Option B: Via CLI (if you have psql configured)**

```bash
psql <connection-string> -f supabase/migrations/012_create_messaging_system.sql
```

### Step 2: Verify Tables Exist

```bash
NEXT_PUBLIC_SUPABASE_URL=<url> \
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key> \
SUPABASE_SERVICE_ROLE_KEY=<service-key> \
npx tsx scripts/check-messaging-tables.ts
```

Expected output:
```
✅ conversations: EXISTS
✅ conversation_participants: EXISTS
✅ messages: EXISTS
✅ message_rate_limits: EXISTS
✅ member_suspensions: EXISTS
```

### Step 3: Setup Test Data

```bash
NEXT_PUBLIC_SUPABASE_URL=<url> \
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key> \
SUPABASE_SERVICE_ROLE_KEY=<service-key> \
npx tsx scripts/setup-test-conversation.ts
```

This creates:
- Test conversation with ID: `test-conv-1`
- Adds admin and test member as participants

### Step 4: Run Tests

```bash
npx tsx scripts/test-send-message-api.ts
```

---

## 🧪 Test Scenarios

The test script covers 8 scenarios:

### ✅ Test 1: No Authentication
- **Expected**: 401 Unauthorized
- **Validates**: JWT token requirement

### ✅ Test 2: Login
- **Expected**: 200 + member_token cookie
- **Validates**: Authentication system

### ✅ Test 3: Missing Fields
- **Expected**: 400 Bad Request
- **Validates**: Required field validation

### ✅ Test 4: Not a Participant
- **Expected**: 403 Forbidden
- **Validates**: Participant verification

### ✅ Test 5: Member Sends Link
- **Expected**: 400 + "links_not_allowed"
- **Validates**: Link detection + admin-only rule

### ✅ Test 6: Message Too Long
- **Expected**: 400 Bad Request
- **Validates**: 2000 character limit

### ✅ Test 7: Empty Message
- **Expected**: 400 Bad Request
- **Validates**: Content requirement

### ✅ Test 8: Profanity/Spam
- **Expected**: 400 + moderation reason
- **Validates**: Content moderation

---

## 📡 API Usage

### Endpoint
```
POST /api/messages/send
```

### Headers
```
Content-Type: application/json
Cookie: member_token=<jwt-token>
```

### Request Body
```json
{
  "conversation_id": "conv-123",
  "content": "Hello, how are you?"
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Message sent successfully",
  "messageId": "msg-abc123",
  "expiresAt": "2027-04-10T10:30:00.000Z"
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "error": "Authentication required. Please log in."
}
```

**403 Suspended**
```json
{
  "error": "Your account has been suspended and cannot send messages",
  "suspended": true,
  "reason": "Spam or flooding",
  "expiresAt": "2026-10-12T10:00:00.000Z"
}
```

**403 Not Participant**
```json
{
  "error": "You are not a participant of this conversation"
}
```

**429 Rate Limited**
```json
{
  "error": "You are sending messages too quickly. Please wait 30 seconds before sending another message.",
  "rateLimited": true,
  "retryAfter": 30
}
```

**400 Links Not Allowed**
```json
{
  "error": "Only administrators can send messages with links",
  "reason": "links_not_allowed"
}
```

**400 Content Moderation**
```json
{
  "error": "Message contains inappropriate or spam content",
  "flags": ["profanity_or_spam"]
}
```

---

## 🔧 Files Created

### API Endpoint
- `/app/api/messages/send/route.ts` - Main endpoint with 8-step validation

### Libraries
- `/lib/messaging/rate-limit.ts` - Rate limiting logic (5s → 15m escalation)
- `/lib/messaging/moderation.ts` - Content moderation (profanity, spam, links)

### Test Scripts
- `/scripts/check-messaging-tables.ts` - Verify tables exist
- `/scripts/setup-test-conversation.ts` - Create test data
- `/scripts/test-send-message-api.ts` - Comprehensive API tests

### Migration
- `/supabase/migrations/012_create_messaging_system.sql` - Database schema

---

## 📊 Rate Limiting Behavior

### Delay Ladder
- **1st violation**: 5 seconds
- **2nd violation**: 10 seconds
- **3rd violation**: 30 seconds
- **4th violation**: 1 minute
- **5th violation**: 5 minutes
- **6th+ violation**: 15 minutes (max)

### Reset Behavior
- Good behavior (5+ minutes without violation) resets to 5 seconds

---

## 🛡️ Content Moderation Rules

### Blocked Patterns
- Profanity (English + Thai common terms)
- Spam keywords (viagra, casino, click here, free money)
- Excessive repetition (same char 5+ times)
- Excessive punctuation (!!!!!!)
- Excessive caps (>70% uppercase)

### Link Rules
- Members: **Cannot** send links
- Admins: **Can** send links

---

## 🗂️ Data Storage Decision

**Current Implementation: PostgreSQL (Supabase)**

✅ **Why PostgreSQL:**
- Transactional data needs ACID guarantees
- Requires foreign keys (conversations → members)
- Needs RLS (Row Level Security) for privacy
- Real-time subscriptions support
- Complex queries (joins, filters)
- Built-in expiration cleanup (expires_at)

❌ **Why NOT R2 (Cloudflare Object Storage):**
- R2 is for static files (images, videos, PDFs)
- No relational queries
- No real-time updates
- No foreign key constraints
- Harder to implement rate limiting

**Future Consideration:**
- Message attachments (images, files) → Store in R2
- Message content (text) → Keep in PostgreSQL

---

## ✅ Next Steps

1. **Apply migration** to create database tables
2. **Run setup script** to create test conversation
3. **Run test script** to verify all scenarios pass
4. **Integrate frontend** UI for sending messages
5. **Add real-time subscriptions** for live message updates

---

## 🆘 Troubleshooting

### Tables not found?
→ Run migration in Supabase Dashboard SQL Editor

### Authentication fails?
→ Check JWT_SECRET in .env.local matches token generation

### Rate limit not working?
→ Verify message_rate_limits table exists

### Can't verify conversation access?
→ Ensure conversation_participants has records

---

**Created**: 2026-10-11
**Status**: ✅ API Implemented - Database Setup Required
