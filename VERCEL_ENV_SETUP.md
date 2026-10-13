# 🚀 ตั้งค่า Environment Variables ใน Vercel

## ปัญหา
Login ทำงานใน localhost แต่ไม่ทำงานใน Production (Vercel) เพราะ Vercel ยังไม่มี Supabase environment variables

## ✅ Local แก้แล้ว
ใน `localhost:2024` login ทำงานปกติแล้ว ✅

## ⚠️ ยังต้องแก้ใน Vercel Production

### ขั้นตอนที่ 1: ไปที่ Vercel Dashboard
1. ไปที่: https://vercel.com/eurasiaforumsw-4090/eurasia-webapp/settings/environment-variables
2. หรือ: Vercel Dashboard → Project: `eurasia-webapp` → Settings → Environment Variables

### ขั้นตอนที่ 2: เพิ่ม Environment Variables

เพิ่ม variables เหล่านี้ทั้งหมด (สำหรับ **Production**, **Preview**, และ **Development**):

#### Supabase Configuration (Required)

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://nhehjnosjzdczgpjvnmy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZWhqbm9zanpkY3pncGp2bm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MTk2NTMsImV4cCI6MjEwNTk5NTY1M30.SRvxF2vjgy3KSD98ZzuQjPO7tfOoZNIvoO_4mcjs6RE` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZWhqbm9zanpkY3pncGp2bm15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQxOTY1MywiZXhwIjoyMTA1OTk1NjUzfQ.eUga9njnxvHXr35GrqJe592AVD2fnrxiDDwGubgH9XI` |

**สำคัญ:** 
- `NEXT_PUBLIC_*` = เปิดเผยให้ browser เห็นได้ (public)
- `SUPABASE_SERVICE_ROLE_KEY` = เฉพาะ server-side (sensitive)

### ขั้นตอนที่ 3: Redeploy

หลังจากเพิ่ม environment variables แล้ว:

1. ไปที่: Deployments tab
2. เลือก deployment ล่าสุด
3. คลิก "..." → "Redeploy"
4. หรือ push commit ใหม่เพื่อ trigger deployment

### ขั้นตอนที่ 4: ทดสอบใน Production

ไปที่: https://eurasia-webapp-xxx.vercel.app/member/login

ทดสอบด้วย credentials:
- **Email:** `admin@efsw.local`
- **Password:** `EFSW-secure-admin-2024`

## การตรวจสอบว่าแก้แล้ว

### Local (localhost:2024)
```bash
curl -X POST http://localhost:2024/api/members/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@efsw.local","password":"EFSW-secure-admin-2024"}'
```

ควรได้ response:
```json
{
  "success": true,
  "message": "Login successful",
  "member": { ... }
}
```

### Production (Vercel)
เปิด browser console ที่หน้า login แล้วดู Network tab:
- Request: `POST /api/members/login`
- Status: ควรเป็น `200 OK` (ไม่ใช่ 500)
- Response: ควรมี `success: true`

## สาเหตุปัญหา

### ❌ เดิม: Missing Environment Variables
```
Error: supabaseUrl is required.
```
→ ไม่มี `NEXT_PUBLIC_SUPABASE_URL` ใน environment

### ✅ แก้แล้ว: Added Correct Keys
- เพิ่ม `NEXT_PUBLIC_SUPABASE_URL`
- เพิ่ม `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
- เพิ่ม `SUPABASE_SERVICE_ROLE_KEY`

## สรุป

| Environment | Status |
|-------------|--------|
| **Local Development** | ✅ แก้แล้ว - login ทำงาน |
| **Vercel Production** | ⚠️ ต้องเพิ่ม env vars ใน Vercel Dashboard |

**Next Step:** เพิ่ม environment variables ใน Vercel Dashboard แล้ว redeploy
