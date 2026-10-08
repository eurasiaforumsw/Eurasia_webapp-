# 🚀 Vercel Deployment Guide

## สิ่งที่ต้องทำ (5 นาที)

### Step 1: เข้า Vercel Dashboard

ไปที่: https://vercel.com/eurasiaforumsw/eurasia-webapp/settings/environment-variables

---

### Step 2: ลบตัวแปรเก่า (ไม่ปลอดภัย)

ค้นหาและลบ:
- ❌ `NEXT_PUBLIC_ADMIN_PASSWORD`

**วิธีลบ:** คลิก ... → Delete

---

### Step 3: เพิ่มตัวแปรใหม่ 2 ตัว

#### 3.1 เพิ่ม JWT_SECRET

คลิก **"Add New"**

```
Name: JWT_SECRET
Value: Vei6k0vFaMfZmI67q9BH8Iubv6ePDXCc8OZBQbjx9Xw=
Environment: ✓ Production  ✓ Preview  ✓ Development (เลือกทั้งหมด)
```

คลิก **Save**

---

#### 3.2 เพิ่ม ADMIN_PASSWORD_HASH

คลิก **"Add New"** อีกครั้ง

```
Name: ADMIN_PASSWORD_HASH
Value: $2b$12$QI870B2LMENPYRNKh9s.POFRpqLMmXJ7SqpnrqAM9HK7xiNU4aEHq
Environment: ✓ Production  ✓ Preview  ✓ Development (เลือกทั้งหมด)
```

คลิก **Save**

---

### Step 4: Redeploy

1. ไปที่: https://vercel.com/eurasiaforumsw/eurasia-webapp/deployments
2. หา deployment ล่าสุด (บรรทัดบนสุด)
3. คลิก **"..."** (3 จุด) ทางขวา
4. เลือก **"Redeploy"**
5. ยืนยัน **"Redeploy"**
6. รอ 2-3 นาที

---

## ✅ ทดสอบหลัง Deploy

### ทดสอบ Admin Login:

URL: https://eurasia-webapp-.vercel.app/admin/login

**Credentials:**
- Email: `admin@efsw.local`
- Password: `EFSW-secure-admin-2024`

---

## 🔐 Security Features ใหม่

✅ **HttpOnly Cookies** - JavaScript ไม่สามารถเข้าถึง token  
✅ **Server-side JWT** - Middleware ป้องกันทุก request  
✅ **bcrypt Hashing** - Password เข้ารหัสแบบ one-way  
✅ **No Client Secrets** - Password ไม่อยู่ใน browser bundle  
✅ **24h Token Expiry** - Auto logout หลัง 1 วัน

---

## 🎨 Academic Page Features ใหม่

✅ **Author Marquee** - รูปวงกลมเลื่อนอัตโนมัติ  
✅ **Sort Options** - Latest / Most Read  
✅ **Filter by Author** - คลิกรูปเพื่อกรอง  
✅ **Sticky Filters** - Filter bar ติดด้านบน  
✅ **Glassmorphism** - เอฟเฟกต์แก้วทันสมัย  
✅ **Smooth Animations** - Framer Motion  

---

## 📝 Checklist

- [ ] ลบ `NEXT_PUBLIC_ADMIN_PASSWORD`
- [ ] เพิ่ม `JWT_SECRET`
- [ ] เพิ่ม `ADMIN_PASSWORD_HASH`
- [ ] Redeploy
- [ ] ทดสอบ login ที่ /admin/login
- [ ] ทดสอบ academic page

---

## 🆘 ถ้าเจอปัญหา

### Login ไม่ได้:
1. ตรวจสอบว่า environment variables เพิ่มครบ
2. ตรวจสอบว่า redeploy เสร็จแล้ว
3. Clear browser cookies
4. ลองใหม่อีกครั้ง

### Academic page ไม่แสดงถูกต้อง:
1. Hard refresh: Cmd+Shift+R (Mac) หรือ Ctrl+Shift+R (Windows)
2. ตรวจสอบ Console (F12) หา error

---

## 📊 Version Info

- Version: V1.1.3
- Date: 2026-10-08
- Features: JWT Auth + Academic Page Redesign
- Status: ✅ Ready to Deploy

---

**หลังเพิ่ม environment variables แล้ว → Redeploy ทันที!** 🚀
