# 🗃️ Database Migration Instructions

## คุณต้องรัน migrations ด้วยตัวเอง เพราะต้องใช้ database password

### วิธีที่ 1: ใช้ Supabase Dashboard (แนะนำ - ง่ายที่สุด)

1. เปิด Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/nhehjnosjzdczgpjvnmy/sql/new
   ```

2. Copy-paste และรันไฟล์นี้ทีละไฟล์:
   
   **ไฟล์แรก:** `supabase/migrations/006_create_engagement_tables.sql`
   - Select ทั้งหมด → Copy
   - Paste ใน SQL Editor
   - กด Run

   **ไฟล์ที่สอง:** `supabase/migrations/007_add_email_verification.sql`
   - Select ทั้งหมด → Copy
   - Paste ใน SQL Editor
   - กด Run

3. ตรวจสอบว่า tables ถูกสร้างแล้ว:
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
   AND tablename IN (
     'content_likes',
     'member_interests', 
     'content_views',
     'member_sessions',
     'member_activity',
     'content_shares'
   );
   ```

   ควรเห็น 6 tables

---

### วิธีที่ 2: ใช้ Supabase CLI (ถ้ามี database password)

```bash
# ถ้าคุณมี database password
psql "postgresql://postgres.nhehjnosjzdczgpjvnmy:[YOUR_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres" \
  -f supabase/migrations/006_create_engagement_tables.sql

psql "postgresql://postgres.nhehjnosjzdczgpjvnmy:[YOUR_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres" \
  -f supabase/migrations/007_add_email_verification.sql
```

---

### วิธีที่ 3: Local development (ถ้าใช้ Supabase local)

```bash
supabase start
supabase db reset
```

---

## ✅ หลังรัน migrations เสร็จแล้ว

พิมพ์: **"รัน migrations เสร็จแล้ว"**

Claude จะทำต่อ:
- ✅ อัปเดต frontend components ให้ใช้ API ใหม่
- ✅ Test ระบบทั้งหมด
- ✅ Commit & push ไป production

---

## 📋 Tables ที่จะถูกสร้าง

1. **content_likes** - ข้อมูลการกดไลค์
2. **member_interests** - ข้อมูลการบันทึก/save content
3. **content_views** - ข้อมูลการดู content
4. **member_sessions** - ประวัติการ login
5. **member_activity** - log กิจกรรมทั้งหมด
6. **content_shares** - ข้อมูลการแชร์

และเพิ่ม columns ใหม่ใน **members** table:
- `email_verified` (BOOLEAN)
- `verification_token` (TEXT)
- `verification_sent_at` (TIMESTAMPTZ)
