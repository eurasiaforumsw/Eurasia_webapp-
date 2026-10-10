# 🚀 Messaging System Quick Start Guide

## ภาษาไทย

### ขั้นตอนการติดตั้ง

#### 1. รัน Database Migration
```bash
# เข้า Supabase Dashboard → SQL Editor
# Copy ไฟล์นี้และรัน: supabase/migrations/012_create_messaging_system.sql
```

หรือใช้ Supabase CLI:
```bash
npx supabase db push
```

#### 2. ทดสอบว่า Tables ถูกสร้างแล้ว
```bash
# ใน Supabase SQL Editor รัน:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'conversations',
  'conversation_participants', 
  'messages',
  'message_rate_limits',
  'member_suspensions'
);
```

ควรเห็น 5 tables

#### 3. ตั้งค่า Cron Jobs (สำหรับ Cleanup อัตโนมัติ)

ใน Supabase Dashboard → Database → Cron Jobs:

**Job 1: ลบข้อความเก่า (รันทุกวันเวลา 02:00)**
```sql
SELECT cron.schedule(
  'expire-old-messages',
  '0 2 * * *',
  $$SELECT expire_old_messages()$$
);
```

**Job 2: ปลดแบนที่หมดอายุ (รันทุก 1 ชั่วโมง)**
```sql
SELECT cron.schedule(
  'deactivate-expired-suspensions',
  '0 * * * *',
  $$SELECT deactivate_expired_suspensions()$$
);
```

### การใช้งาน API

#### 📝 สร้าง Conversation
```typescript
const response = await fetch('/api/messages/conversations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipientMemberId: 'member_xxx'
  })
});

const { conversationId } = await response.json();
```

#### 💬 ส่งข้อความ
```typescript
const response = await fetch('/api/messages/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId: 'conv_xxx',
    content: 'สวัสดีครับ!'
  })
});

const { success, message } = await response.json();
```

#### 📬 ดึงข้อความทั้งหมดใน Conversation
```typescript
const response = await fetch(`/api/messages/${conversationId}`);
const { messages } = await response.json();
```

#### 📋 ดึงรายการ Conversations
```typescript
const response = await fetch('/api/messages/conversations');
const { conversations } = await response.json();

// แต่ละ conversation มี:
// - participants (รายชื่อสมาชิก)
// - lastMessage (ข้อความล่าสุด)
// - unreadCount (จำนวนข้อความที่ยังไม่ได้อ่าน)
```

#### 🚫 แบนสมาชิก (Admin เท่านั้น)
```typescript
const response = await fetch('/api/messages/suspend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    memberId: 'member_xxx',
    reasonCategory: 'spam_flooding', // หรือ abusive_language, harassment, etc.
    reasonDetail: 'ส่งข้อความ spam มากกว่า 50 ข้อความใน 1 นาที',
    suspensionType: 'temp_24h', // หรือ temp_custom, permanent
    customDays: 7 // ใช้เมื่อ suspensionType = temp_custom
  })
});
```

#### ✅ ปลดแบน (Admin เท่านั้น)
```typescript
const response = await fetch(`/api/messages/suspend?memberId=${memberId}`, {
  method: 'DELETE'
});
```

#### 📊 ดูประวัติการแบน (Admin เท่านั้น)
```typescript
const response = await fetch(`/api/messages/suspend?memberId=${memberId}`);
const { suspensions } = await response.json();
```

### Rate Limiting Rules

- **ปกติ**: 1 ข้อความ / 5 วินาที
- **ละเมิด 1 ครั้ง**: รอ 10 วินาที
- **ละเมิด 2 ครั้ง**: รอ 30 วินาที
- **ละเมิด 3 ครั้ง**: รอ 1 นาที
- **ละเมิด 4 ครั้ง**: รอ 5 นาที
- **ละเมิด 5 ครั้ง**: รอ 15 นาที

### Error Messages

```typescript
// ถูก rate limit
{
  "error": "You can send another message in 10 seconds"
}

// ถูกแบน
{
  "error": "Your account is suspended until 2024-01-08 12:00:00. Reason: spam_flooding"
}

// ไม่ได้ login
{
  "error": "Unauthorized. Please login."
}

// ไม่มีสิทธิ์ (ไม่ใช่ participant)
{
  "error": "You are not a participant in this conversation"
}
```

### Storage แนะนำ

✅ **ใช้ Supabase Database สำหรับ:**
- ข้อความ text (messages table)
- Metadata ของ conversations
- Rate limiting records
- Suspension history

✅ **ใช้ R2 สำหรับ:**
- รูปภาพที่แนบในข้อความ (future feature)
- ไฟล์เอกสาร (future feature)
- Avatar ของสมาชิก (ถ้ายังไม่ได้ใช้)
- Content gallery images (ใช้อยู่แล้ว)

### Admin Console Integration

เพิ่มในหน้า Admin Console:

```typescript
// components/admin/MessagingModeration.tsx
import { useState, useEffect } from 'react';

export default function MessagingModeration() {
  const [members, setMembers] = useState([]);

  async function suspendMember(memberId: string) {
    const reason = prompt('เหตุผล:');
    const days = prompt('จำนวนวัน (เว้นว่างสำหรับ 24 ชม.):');
    
    await fetch('/api/messages/suspend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberId,
        reasonCategory: 'other',
        reasonDetail: reason,
        suspensionType: days ? 'temp_custom' : 'temp_24h',
        customDays: days ? parseInt(days) : undefined
      })
    });
    
    alert('แบนสมาชิกแล้ว');
  }

  async function liftSuspension(memberId: string) {
    await fetch(`/api/messages/suspend?memberId=${memberId}`, {
      method: 'DELETE'
    });
    alert('ปลดแบนแล้ว');
  }

  return (
    <div>
      <h2>Member Moderation</h2>
      {members.map(member => (
        <div key={member.id}>
          <span>{member.fullName}</span>
          <button onClick={() => suspendMember(member.id)}>แบน</button>
          <button onClick={() => liftSuspension(member.id)}>ปลดแบน</button>
        </div>
      ))}
    </div>
  );
}
```

### Troubleshooting

#### ส่งข้อความไม่ได้ แม้ไม่ถูกแบน
1. ตรวจสอบว่า member อยู่ใน conversation_participants
2. ตรวจสอบ rate limit: `SELECT * FROM message_rate_limits WHERE member_id = 'xxx'`
3. ดู error log ใน browser console

#### Rate limit ไม่ reset
- Function `reset_rate_limit()` จะ reset ทุกเที่ยงคืน
- หรือ manual reset: `UPDATE message_rate_limits SET last_message_at = NOW() - INTERVAL '1 day' WHERE member_id = 'xxx'`

#### Unread count ไม่ถูกต้อง
- เมื่อเปิดอ่านข้อความ ต้อง update: `UPDATE conversation_participants SET last_read_at = NOW() WHERE ...`
- API `/api/messages/[id]` จะ update อัตโนมัติเมื่อดึงข้อความ

### Files ที่เกี่ยวข้อง

```
📁 supabase/migrations/
  └── 012_create_messaging_system.sql      (Database schema)

📁 app/api/messages/
  ├── conversations/route.ts               (GET: list, POST: create)
  ├── send/route.ts                        (POST: send message)
  ├── suspend/route.ts                     (POST: suspend, GET: history, DELETE: lift)
  └── [id]/route.ts                        (GET: messages in conversation)

📁 lib/auth/
  └── jwt.ts                               (JWT verification helper)

📁 Documentation/
  ├── MESSAGING_SYSTEM.md                  (Full documentation)
  ├── MESSAGING_TEST_RESULTS.md            (Test results)
  └── MESSAGING_QUICK_START.md             (This file)

📁 Tests/
  ├── test-messaging-api.js                (Integration tests)
  └── supabase/test_messaging_migration.sql (Migration verification)
```

### Performance Tips

1. **Index หลักทุกตัวถูกสร้างไว้แล้ว** ใน migration
2. **Pagination**: เพิ่ม `LIMIT` และ `OFFSET` ใน query ถ้ามีข้อความเยอะ
3. **Real-time**: ใช้ Supabase Realtime subscription สำหรับ live updates:

```typescript
const channel = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    },
    (payload) => {
      console.log('New message:', payload.new);
      // Update UI
    }
  )
  .subscribe();
```

---

## English Version

### Installation Steps

#### 1. Run Database Migration
```bash
# Go to Supabase Dashboard → SQL Editor
# Copy and run: supabase/migrations/012_create_messaging_system.sql
```

Or use Supabase CLI:
```bash
npx supabase db push
```

#### 2. Verify Tables Created
```bash
# In Supabase SQL Editor, run:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'conversations',
  'conversation_participants', 
  'messages',
  'message_rate_limits',
  'member_suspensions'
);
```

Should see 5 tables.

#### 3. Setup Cron Jobs (for Auto Cleanup)

In Supabase Dashboard → Database → Cron Jobs:

**Job 1: Delete old messages (daily at 02:00)**
```sql
SELECT cron.schedule(
  'expire-old-messages',
  '0 2 * * *',
  $$SELECT expire_old_messages()$$
);
```

**Job 2: Deactivate expired suspensions (hourly)**
```sql
SELECT cron.schedule(
  'deactivate-expired-suspensions',
  '0 * * * *',
  $$SELECT deactivate_expired_suspensions()$$
);
```

### API Usage

See Thai section above for complete API examples - the code is the same, just use English content strings.

### Rate Limiting Rules

- **Normal**: 1 message / 5 seconds
- **Violation 1**: Wait 10 seconds
- **Violation 2**: Wait 30 seconds
- **Violation 3**: Wait 1 minute
- **Violation 4**: Wait 5 minutes
- **Violation 5**: Wait 15 minutes

### Complete System Features

✅ **Messaging Rules**
- Admin → Member: text + links allowed
- Member → Admin: text only
- Member ↔ Member: text only
- Messages expire after 180 days

✅ **Anti-Spam System**
- Rate limiting with escalating cooldowns
- Spam pattern detection
- Link detection (admin-only)
- Max 2000 characters per message

✅ **Suspension System**
- Temporary 24h ban
- Custom duration ban
- Permanent ban
- Suspension history tracking
- Multiple reason categories

✅ **Security**
- JWT authentication on all endpoints
- Row-level security (RLS) policies
- Participant verification
- Admin role checking

✅ **Maintenance**
- Auto-expire old messages (180 days)
- Auto-deactivate expired suspensions
- Automatic cleanup via cron jobs

---

## 🎉 System Ready!

ระบบพร้อมใช้งานแล้ว! เพียงแค่รัน migration แล้วเริ่มใช้ API endpoints

System ready! Just run the migration and start using the API endpoints.
