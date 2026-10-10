# Messaging System Documentation

## Overview
Complete messaging system with anti-spam protection, rate limiting, and member suspension features.

## Features

### ✅ Messaging Rules
- **Admin → Member**: Can send text + links
- **Member → Admin**: Can send text only
- **Member ↔ Member**: Can send text only
- **Message Expiration**: 180 days (automatic cleanup)
- **Max Message Length**: 2000 characters

### 🛡 Anti-Spam System
- **Rate Limiting**: 1 message per 5 seconds
- **Escalating Cooldown**: 5s → 10s → 30s → 1m → 5m → 15m
- **Spam Detection**: Basic pattern matching for common spam phrases
- **Link Detection**: Only admins can send links

### 🚫 Member Suspension System
- **Temporary Ban 24h**: Automatic 24-hour suspension
- **Temporary Ban Custom**: Suspend for X days (admin specifies)
- **Permanent Ban**: Indefinite suspension
- **Suspension Reasons**:
  - Spam or flooding (`spam_flooding`)
  - Abusive language (`abusive_language`)
  - Harassment (`harassment`)
  - Inappropriate content (`inappropriate_content`)
  - Terms of service violation (`tos_violation`)
  - Other (`other` - requires detail)

### ⏰ Auto Logout
- **Session Timeout**: JWT expires after 7 days
- **Activity-based**: Managed by JWT expiration

## Database Schema

### Tables Created
1. **conversations** - Main conversation container
2. **conversation_participants** - Join table for members in conversations
3. **messages** - Individual messages with 180-day expiration
4. **message_rate_limits** - Track sending frequency and violations
5. **member_suspensions** - Suspension records and history

### Migration File
- `/supabase/migrations/012_create_messaging_system.sql`

## API Endpoints

### 1. Get Conversations
```
GET /api/messages/conversations
```
- **Auth**: Required (JWT token in cookie)
- **Returns**: List of conversations with participants, last message, unread count
- **Sorted by**: Last message timestamp (DESC)

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv_xxx",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastMessageAt": "2024-01-01T12:00:00Z",
      "participants": [
        {
          "id": "member_xxx",
          "fullName": "John Doe",
          "avatarUrl": "https://...",
          "role": "member"
        }
      ],
      "lastMessage": {
        "id": "msg_xxx",
        "content": "Hello!",
        "createdAt": "2024-01-01T12:00:00Z",
        "senderId": "member_xxx"
      },
      "unreadCount": 2
    }
  ]
}
```

### 2. Create Conversation
```
POST /api/messages/conversations
```
- **Auth**: Required
- **Body**: `{ "recipientMemberId": "member_xxx" }`
- **Returns**: Conversation ID (existing or new)

**Response:**
```json
{
  "conversationId": "conv_xxx",
  "existed": false
}
```

### 3. Get Messages
```
GET /api/messages/[conversationId]
```
- **Auth**: Required (must be participant)
- **Returns**: All messages in conversation
- **Side Effect**: Updates `last_read_at` for requester

**Response:**
```json
{
  "messages": [
    {
      "id": "msg_xxx",
      "content": "Hello!",
      "hasLink": false,
      "createdAt": "2024-01-01T12:00:00Z",
      "sender": {
        "id": "member_xxx",
        "fullName": "John Doe",
        "avatarUrl": "https://...",
        "role": "member"
      },
      "isOwn": false
    }
  ]
}
```

### 4. Send Message
```
POST /api/messages/send
```
- **Auth**: Required
- **Body**: `{ "conversationId": "conv_xxx", "content": "Hello!" }`
- **Rate Limited**: Yes
- **Spam Checked**: Yes

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "msg_xxx",
    "conversationId": "conv_xxx",
    "senderId": "member_xxx",
    "content": "Hello!",
    "hasLink": false,
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

**Error (Rate Limited):**
```json
{
  "error": "You can send another message in 10 seconds"
}
```

### 5. Suspend Member (Admin Only)
```
POST /api/messages/suspend
```
- **Auth**: Required (admin role)
- **Body**:
```json
{
  "memberId": "member_xxx",
  "reasonCategory": "spam_flooding",
  "reasonDetail": "Sent 50 messages in 1 minute",
  "suspensionType": "temp_custom",
  "customDays": 7
}
```

**Response:**
```json
{
  "success": true,
  "suspension": {
    "id": "susp_xxx",
    "memberId": "member_xxx",
    "suspendedBy": "admin_xxx",
    "reasonCategory": "spam_flooding",
    "reasonDetail": "Sent 50 messages in 1 minute",
    "suspensionType": "temp_custom",
    "expiresAt": "2024-01-08T12:00:00Z",
    "suspendedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 6. Get Suspension History (Admin Only)
```
GET /api/messages/suspend?memberId=member_xxx
```
- **Auth**: Required (admin role)
- **Returns**: All suspension records for a member

### 7. Lift Suspension (Admin Only)
```
DELETE /api/messages/suspend?memberId=member_xxx
```
- **Auth**: Required (admin role)
- **Effect**: Deactivates active suspensions and restores member status to "active"

## Setup Instructions

### 1. Run Database Migration
```bash
# Option 1: Supabase CLI
supabase db reset

# Option 2: Supabase Dashboard
# Go to SQL Editor and run: supabase/migrations/012_create_messaging_system.sql
```

### 2. Verify Migration
Run the test SQL script:
```bash
# In Supabase SQL Editor
# Run: supabase/test_messaging_migration.sql
```

### 3. Test API Endpoints
```bash
# Start the dev server
npm run dev

# In another terminal, run integration tests
node test-messaging-api.js
```

## Maintenance Tasks

### Clean Up Expired Messages (Run Daily)
```sql
SELECT expire_old_messages();
```

### Deactivate Expired Suspensions (Run Daily)
```sql
SELECT deactivate_expired_suspensions();
```

**Recommended**: Set up Supabase cron jobs or Edge Functions to run these automatically.

## Security Features

1. **JWT Authentication**: All endpoints verify member token
2. **Suspension Check**: Every request checks if member is suspended
3. **Participant Verification**: Can only read/send in conversations you're part of
4. **Role-Based Access**: Admin-only endpoints for moderation
5. **SQL Injection Protection**: Parameterized queries via Supabase client
6. **XSS Protection**: Content sanitization recommended on frontend
7. **Rate Limiting**: Server-side enforcement with escalating penalties

## Frontend Integration Notes

### Required Libraries
```bash
npm install date-fns  # For date formatting
```

### Example Usage
```typescript
// Get conversations
const response = await fetch('/api/messages/conversations');
const { conversations } = await response.json();

// Create conversation
const response = await fetch('/api/messages/conversations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ recipientMemberId: 'member_xxx' })
});

// Send message
const response = await fetch('/api/messages/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId: 'conv_xxx',
    content: 'Hello!'
  })
});
```

## Error Handling

### Common Error Codes
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (suspended, wrong role, or not participant)
- `404`: Not found (conversation or member doesn't exist)
- `429`: Rate limited (sending too fast)
- `400`: Bad request (invalid data)
- `500`: Server error

### Suspended Member Response
When a member is suspended, all API calls return:
```json
{
  "error": "Your account is suspended until 2024-01-08 12:00:00. Reason: spam_flooding"
}
```

## Admin Console Integration

### Suggested UI Components
1. **Message Moderation Panel**
   - View all conversations
   - Filter by date, participants
   - Search message content

2. **Member Management**
   - Suspend button in member list
   - Suspension history modal
   - Quick actions: 24h ban, lift suspension

3. **Spam Detection Dashboard**
   - Rate limit violations log
   - Most reported members
   - Spam pattern matches

## Storage Recommendations

As requested, **messages are stored in Supabase Database**, not R2, because:
- ✅ Real-time queries and search
- ✅ Relational structure (conversations, participants, messages)
- ✅ Built-in security with RLS
- ✅ Automatic indexing
- ✅ Text data is small (~1KB per message)

**Use R2 for:**
- Message attachments (images, files) - if you add this feature later
- Member avatars
- Content media

## Next Steps

1. ✅ Database migration created
2. ✅ API endpoints implemented
3. ✅ Authentication integrated
4. ✅ Rate limiting active
5. ✅ Suspension system ready
6. 🔲 Build frontend UI components
7. 🔲 Set up daily cleanup cron jobs
8. 🔲 Add real-time updates (Supabase Realtime)
9. 🔲 Build admin moderation dashboard
10. 🔲 Add message attachments (optional)

## File Locations

- **Migration**: `/supabase/migrations/012_create_messaging_system.sql`
- **Auth Helper**: `/lib/auth/jwt.ts`
- **API Routes**:
  - `/app/api/messages/conversations/route.ts`
  - `/app/api/messages/send/route.ts`
  - `/app/api/messages/[id]/route.ts`
  - `/app/api/messages/suspend/route.ts`
- **Tests**:
  - `/supabase/test_messaging_migration.sql`
  - `/test-messaging-api.js`
