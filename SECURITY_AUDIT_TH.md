# 🚨 รายงานช่องโหว่ด้านความปลอดภัย Admin Console

## สรุปผู้บริหาร
ระบบ authentication ของ Admin ปัจจุบันมี**ช่องโหว่ร้ายแรง**ที่ทำให้**ผู้ใช้ทั่วไปสามารถ bypass การยืนยันตัวตนและเข้าถึง Admin Console ได้โดยไม่ต้องรู้รหัสผ่าน**

---

## ช่องโหว่ที่พบ

### 1. ⚠️ localStorage Authentication Bypass (วิกฤต)
**ระดับความรุนแรง: CRITICAL**

**ปัญหา:**
- ระบบเก็บ admin session ใน `localStorage` (ฝั่ง client)
- ใครก็ตามที่เปิด Browser Console ได้ สามารถสร้าง fake admin session

**วิธีแฮค (ใช้เวลา 5 วินาที):**
```javascript
// เปิด Browser Console (กด F12) แล้ววาง code นี้:
localStorage.setItem('efsw.admin.session', JSON.stringify({
  id: 'hacker',
  name: 'Fake Admin',
  email: 'admin@efsw.local',
  role: 'super-admin',
  signedInAt: new Date().toISOString()
}));
window.location.href = '/admin';
// ✅ เข้า Admin Console ได้ทันที โดยไม่ต้องรู้รหัสผ่าน!
```

**ผลกระทบ:**
- ควบคุม Admin Console ได้เต็มที่
- ลบ/แก้ไข content, members ทั้งหมด
- Export ข้อมูลสมาชิกทั้งหมด (email, เบอร์โทร, ฯลฯ)
- เปลี่ยนการตั้งค่าเว็บไซต์

---

### 2. ⚠️ Middleware ไม่ได้ป้องกันจริง (สูง)
**ระดับความรุนแรง: HIGH**

**ปัญหา:**
```typescript
// middleware.ts:34-36
const response = NextResponse.next(); // ❌ ไม่ได้บล็อก!
response.headers.set('x-middleware-route', 'admin');
return response;
```

- Middleware แค่เพิ่ม header แต่**ไม่ได้บล็อก request**
- หน้า Admin โหลดก่อน แล้วค่อย redirect ด้วย JavaScript
- ช่วง 1-2 วินาทีนั้น เห็น Admin UI ได้

**การทดสอบ:**
1. เปิด `/admin` โดยไม่ login
2. แม้จะ redirect ไป `/admin/login` แต่เห็น Admin Dashboard วาบไปก่อน
3. ใช้ Network throttling ช้าๆ จะเห็นได้ชัดเจน

---

### 3. ⚠️ API Routes เปิดกว้าง (วิกฤต)
**ระดับความรุนแรง: CRITICAL**

**ปัญหา:**
```typescript
// middleware.ts:17
if (pathname.startsWith('/api')) {
  return NextResponse.next(); // ❌ API ทั้งหมดไม่มีการตรวจสอบ!
}
```

**การทดสอบ:**
```bash
# ใครก็เรียกได้ ไม่ต้อง authentication
curl https://eurasia-webapp.vercel.app/api/members
curl https://eurasia-webapp.vercel.app/api/content
# ✅ ได้ข้อมูลทั้งหมดจาก database!
```

**ผลกระทบ:**
- ดึงข้อมูลสมาชิกทั้งหมดได้ (email, phone, address)
- ดึง content ทั้งหมด รวมถึง draft ที่ยังไม่ publish
- อาจ POST/DELETE ได้ถ้า API routes ไม่มีการตรวจสอบ

---

### 4. ⚠️ รหัสผ่านอยู่ใน Browser Bundle (สูง)
**ระดับความรุนแรง: HIGH**

**ปัญหา:**
```typescript
// admin-auth.ts:118
const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "EFSW-demo";
```

- ตัวแปร `NEXT_PUBLIC_*` ถูก compile เข้าไปใน JavaScript bundle
- เปิด DevTools → Sources → Search → หา `NEXT_PUBLIC_ADMIN_PASSWORD`
- ✅ **เห็นรหัสผ่านได้ทันที**

**วิธีดู:**
1. เปิด DevTools (F12)
2. Sources tab → Search (Cmd/Ctrl + Shift + F)
3. ค้นหา `ADMIN_PASSWORD`
4. เห็นรหัสผ่านชัดเจนใน minified bundle

---

### 5. ⚠️ Rate Limiting อ่อนแอ (ปานกลาง)
**ระดับความรุนแรง: MEDIUM**

**ปัญหา:**
- Rate limiting เก็บใน `localStorage` (ฝั่ง client)
- แฮกเกอร์ลบ `localStorage.removeItem('efsw.admin.attempts')` ได้
- ลอง login ไม่จำกัดครั้ง

---

## วิธีแก้ไขที่แนะนำ

### ✅ แนวทางที่ 1: JWT + HttpOnly Cookies (แนะนำ)

#### ขั้นตอนที่ 1: ติดตั้ง dependencies
```bash
npm install jsonwebtoken bcrypt cookie
npm install -D @types/jsonwebtoken @types/bcrypt @types/cookie
```

#### ขั้นตอนที่ 2: สร้าง API สำหรับ login
สร้างไฟล์: `app/api/admin/auth/login/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET!; // เก็บฝั่ง server เท่านั้น!
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH!;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // ตรวจสอบ email
    if (email !== 'admin@efsw.local') {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง' },
        { status: 401 }
      );
    }
    
    // ตรวจสอบ password (hash)
    const valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!valid) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง' },
        { status: 401 }
      );
    }
    
    // สร้าง JWT token
    const token = jwt.sign(
      { 
        email, 
        role: 'super-admin',
        name: 'EFSW Administrator'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // เก็บใน HttpOnly cookie (JavaScript เข้าถึงไม่ได้)
    const cookie = serialize('admin_token', token, {
      httpOnly: true,  // ❌ JavaScript ไม่สามารถอ่านได้
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400, // 24 ชั่วโมง
      path: '/'
    });
    
    return NextResponse.json(
      { success: true },
      { headers: { 'Set-Cookie': cookie } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}
```

#### ขั้นตอนที่ 3: แก้ไข Middleware ให้ป้องกันจริง
แก้ไฟล์: `middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // ข้าม static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // ป้องกัน Admin routes
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('admin_token')?.value;
    
    if (!token) {
      // ❌ บล็อกทันที
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    try {
      // ตรวจสอบ JWT
      jwt.verify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      // Token ไม่ถูกต้อง
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  // ป้องกัน Admin API routes
  if (
    pathname.startsWith('/api/admin') || 
    pathname.startsWith('/api/content') ||
    pathname.startsWith('/api/members')
  ) {
    const token = request.cookies.get('admin_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    try {
      jwt.verify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/public).*)',
  ],
};
```

#### ขั้นตอนที่ 4: สร้าง password hash
```bash
# รันคำสั่งนี้ครั้งเดียว
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YOUR_STRONG_PASSWORD', 10, (err, hash) => console.log(hash));"

# จะได้ hash แบบนี้:
# $2b$10$qV8wZc3... (ตัวอย่าง)
```

#### ขั้นตอนที่ 5: อัพเดท Environment Variables

**ใน Vercel:**
```bash
# ลบตัวเก่า
❌ NEXT_PUBLIC_ADMIN_PASSWORD

# เพิ่มตัวใหม่ (SERVER-SIDE ONLY)
✅ JWT_SECRET=your-super-secret-key-at-least-32-characters-long
✅ ADMIN_PASSWORD_HASH=$2b$10$qV8wZc3... (จาก step 4)
```

**ในไฟล์ `.env`:**
```bash
# ลบ
# NEXT_PUBLIC_ADMIN_PASSWORD=xxx

# เพิ่ม (ไม่ต้องมี NEXT_PUBLIC_)
JWT_SECRET=your-super-secret-key-at-least-32-characters-long
ADMIN_PASSWORD_HASH=$2b$10$qV8wZc3...
```

#### ขั้นตอนที่ 6: แก้ไข login page ให้เรียก API
แก้ไฟล์: `app/admin/login/page.tsx`

```typescript
const submit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setError("");
  setSubmitting(true);
  
  try {
    // เรียก API แทน client-side check
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Login failed');
    }
    
    addToast({
      type: "success",
      title: "ยินดีต้อนรับ!",
      description: "เข้าสู่ระบบสำเร็จ",
    });
    
    window.location.replace("/admin");
  } catch (submissionError) {
    const errorMessage = submissionError instanceof Error
      ? submissionError.message
      : "ไม่สามารถเข้าสู่ระบบได้";
    setError(errorMessage);
    setSubmitting(false);
  }
};
```

---

### ✅ แนวทางที่ 2: ใช้ Supabase Auth (ทางเลือก)

ใช้ระบบ authentication ของ Supabase:
- มี JWT validation ฝั่ง server
- RLS policies ป้องกัน database
- รหัสผ่านไม่อยู่ใน bundle
- จัดการ session อัตโนมัติ

**ตัวอย่าง:**
```typescript
import { createClient } from '@supabase/supabase-js';

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@efsw.local',
  password: password,
});

// ตรวจสอบใน middleware
const token = request.cookies.get('sb-access-token');
const { data: user } = await supabase.auth.getUser(token);
```

---

## การดำเนินการเร่งด่วน

### 🚨 ทำทันที:

1. **ลบ NEXT_PUBLIC_ADMIN_PASSWORD** จาก:
   - [ ] ไฟล์ `.env`
   - [ ] `lib/admin-auth.ts`
   - [ ] Vercel Environment Variables

2. **Implement server-side authentication** (แนวทางที่ 1 หรือ 2)

3. **เพิ่มการป้องกัน API routes**:
   - [ ] ตรวจสอบ JWT ทุก request
   - [ ] Return 401 ถ้าไม่มี auth

4. **เพิ่ม rate limiting** ที่ `/api/admin/auth/login`:
   ```typescript
   // ใช้ Vercel Rate Limiting หรือ Upstash Redis
   ```

5. **เพิ่ม CSRF protection** สำหรับการเปลี่ยนแปลงข้อมูล

---

## Checklist การทดสอบ

หลังแก้ไขแล้ว ต้องทดสอบ:

- [ ] ไม่สามารถเข้า `/admin` โดยไม่ login
- [ ] ไม่สามารถสร้าง fake session ผ่าน localStorage
- [ ] ไม่สามารถเรียก `/api/admin/*` หรือ `/api/content` โดยไม่มี auth
- [ ] รหัสผ่านไม่แสดงใน DevTools
- [ ] JWT token เก็บใน HttpOnly cookie
- [ ] Middleware บล็อก unauthorized requests (ไม่ใช่แค่ client-side redirect)
- [ ] Rate limiting ทำงานที่ login endpoint
- [ ] Session หมดอายุหลัง logout/timeout

---

## ระดับความสำคัญ

**🚨 เร่งด่วนที่สุด - Deploy ทันที**
- ระบบปัจจุบันอนุญาตให้**ใครก็ตาม**เข้าถึง Admin ได้เต็มที่
- Production deployment มีความเสี่ยงสูงมาก
- ข้อมูลสมาชิกอาจรั่วไหล

---

## คำถาม?

ติดต่อทีม security หรือ senior developer ก่อน deploy ระบบ admin ขึ้น production
