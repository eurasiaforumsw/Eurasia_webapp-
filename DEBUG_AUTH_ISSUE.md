# 🔧 แก้ปัญหา "Unauthorized" ตอนเข้าล็อกอิน

## ปัญหาที่พบ
ตอน login ที่ `/member/login` ได้ error "Unauthorized" แม้ว่าจะใส่ email/password ถูกต้อง

## สาเหตุ

### 1. ไฟล์ Environment Variables ไม่ครบ
ไฟล์ `.env.local` มีเฉพาะ:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

แต่โค้ดต้องการ:
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 2. Database ยังไม่มี column `role`
Table `members` ยังไม่ถูก migrate เพื่อเพิ่ม column `role` ที่จำเป็นสำหรับ RBAC (Role-Based Access Control)

### 3. ยังไม่มี Admin/Member accounts ใน database
Database ยังไม่ถูก seed ด้วย test accounts

## วิธีแก้ (Step-by-Step)

### ขั้นตอนที่ 1: แก้ไขไฟล์ `.env.local`
ไฟล์ `.env.local` ปัจจุบัน:
```env
NEXT_PUBLIC_SUPABASE_URL=https://nhehjnosjzdczgpjvnmy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_h1tAqZVECiVNemLvFmD-qQ_7_U_GGOe
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **แก้แล้ว** - ไฟล์ถูกอัพเดทแล้ว

### ขั้นตอนที่ 2: Run SQL Script ใน Supabase

1. ไปที่ [Supabase SQL Editor](https://supabase.com/dashboard/project/nhehjnosjzdczgpjvnmy/sql/new)
2. Copy ไฟล์ `SETUP_COMPLETE_AUTH.sql` ทั้งหมด
3. Paste แล้วกด **"Run"**

Script นี้จะ:
- ✅ ตรวจสอบและเพิ่ม column `role` (ถ้ายังไม่มี)
- ✅ ตรวจสอบและเพิ่ม column `email_verified_at` และ `verification_token`
- ✅ สร้าง/อัพเดท admin account
- ✅ สร้าง/อัพเดท demo member account
- ✅ สร้าง/อัพเดท PR editor account

### ขั้นตอนที่ 3: Restart Development Server

```bash
# หยุด server (Ctrl+C)
# เริ่มใหม่
npm run dev
```

### ขั้นตอนที่ 4: ทดสอบ Login

ไปที่: https://eurasia-webapp-xxx.vercel.app/member/login

**Test Accounts:**

| Email | Password | Role |
|-------|----------|------|
| `admin@efsw.local` | `EFSW-secure-admin-2024` | Admin (full access) |
| `member@efsw.local` | `M` | Member |
| `news@efsw.local` | `EFSW-news-pr-2024` | PR Editor |

## การทดสอบ API โดยตรง

ใช้ script test:
```bash
npx tsx scripts/test-login-api.ts
```

หรือใช้ curl:
```bash
curl -X POST http://localhost:3000/api/members/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@efsw.local","password":"EFSW-secure-admin-2024"}'
```

## Expected Response เมื่อ Login สำเร็จ

```json
{
  "success": true,
  "message": "Login successful",
  "member": {
    "id": "admin@efsw.local",
    "fullName": "System Administrator",
    "email": "admin@efsw.local",
    "role": "admin",
    "status": "active",
    ...
  }
}
```

และจะได้ cookie `member_token` ที่เป็น JWT

## ตรวจสอบว่าแก้แล้วหรือยัง

### 1. ตรวจสอบ Environment Variables
```bash
grep -E "NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE" .env.local
```

ควรเห็น 4 บรรทัด (URL, ANON_KEY, PUBLISHABLE_KEY, SERVICE_ROLE_KEY)

### 2. ตรวจสอบ Database (ใน Supabase)
```sql
-- ตรวจสอบว่ามี column role
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'members' AND column_name = 'role';

-- ตรวจสอบว่ามี test accounts
SELECT email, role, status, email_verified_at 
FROM members 
WHERE email IN ('admin@efsw.local', 'member@efsw.local', 'news@efsw.local');
```

### 3. ตรวจสอบ Console Logs
เปิด Browser DevTools → Console และดู:
- Network tab: ตรวจสอบ response จาก `/api/members/login`
- Console tab: ตรวจสอบว่ามี error หรือไม่

## Common Errors และวิธีแก้

### Error: "Member service is not configured"
- ❌ `SUPABASE_SERVICE_ROLE_KEY` ยังไม่ถูกตั้งค่า
- ✅ เพิ่ม key ใน `.env.local` และ restart server

### Error: "column 'role' does not exist"
- ❌ Migration `008_add_member_roles.sql` ยังไม่ถูก run
- ✅ Run `SETUP_COMPLETE_AUTH.sql` ใน Supabase

### Error: "Invalid email or password"
- ❌ Account ยังไม่ถูก seed หรือ password ไม่ถูกต้อง
- ✅ Run `SETUP_COMPLETE_AUTH.sql` เพื่อ seed accounts
- ✅ ตรวจสอบว่าใช้ password ที่ถูกต้อง (เช่น `EFSW-secure-admin-2024` ไม่ใช่ `EFSW-demo-admin-2024`)

### Error: Network timeout
- ❌ Supabase service ไม่ available หรือ network มีปัญหา
- ✅ ตรวจสอบ Supabase dashboard ว่า project ยังทำงานอยู่
- ✅ ตรวจสอบ internet connection

## Files ที่เกี่ยวข้อง

- `/lib/supabase.ts` - Supabase client configuration
- `/lib/member-auth.ts` - Member authentication logic
- `/app/api/members/login/route.ts` - Login API endpoint
- `/app/member/login/page.tsx` - Login UI
- `/middleware.ts` - Auth middleware
- `/.env.local` - Environment variables
- `/SETUP_COMPLETE_AUTH.sql` - Complete setup script
- `/scripts/test-login-api.ts` - API test script

## สรุป

ปัญหาหลัก 3 อย่าง:
1. ✅ ไม่มี `NEXT_PUBLIC_SUPABASE_ANON_KEY` → **แก้แล้ว**
2. ⚠️  Database ยังไม่มี column `role` → **ต้อง run SQL script**
3. ⚠️  Database ยังไม่มี test accounts → **ต้อง run SQL script**

**Next Step:** Run `SETUP_COMPLETE_AUTH.sql` ใน Supabase แล้วทดสอบ login อีกครั้ง
