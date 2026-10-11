# 🎯 คู่มือเริ่มต้นใช้งานระบบลงทะเบียน Event

## สถานะปัจจุบัน
✅ **เสร็จสมบูรณ์** - ระบบลงทะเบียน Event พร้อมใช้งาน  
⚠️ **รอดำเนินการ** - ต้อง Apply Database Migration

---

## 📋 สิ่งที่สร้างเสร็จแล้ว

### 1️⃣ Database (4 ตาราง)
- `event_registration_settings` - ตั้งค่าการลงทะเบียน
- `event_registration_fields` - ฟอร์มคำถาม (9 ประเภท)
- `event_registrations` - ข้อมูลผู้ลงทะเบียน
- `event_registration_answers` - คำตอบของผู้ลงทะเบียน

### 2️⃣ API Endpoints (4 routes)
- `GET /api/events/[id]/registration-settings` - ดึงการตั้งค่า
- `GET /api/events/[id]/registration-fields` - ดึงฟอร์ม
- `GET /api/events/[id]/registration-status` - เช็คว่าลงทะเบียนแล้วหรือยัง
- `POST /api/events/[id]/register` - ส่งฟอร์มลงทะเบียน

### 3️⃣ Frontend Components (2 components)
- `RegistrationButton` - ปุ่มลงทะเบียน (7 states)
- `RegistrationModal` - Modal ฟอร์มลงทะเบียน

### 4️⃣ Event Page Integration
- เพิ่ม Registration Section ในหน้า Event
- แสดงสถิติผู้ลงทะเบียน
- ปุ่ม CTA โดดเด่น
- Responsive บน Mobile/Tablet/Desktop

---

## ⚡ เริ่มใช้งาน (3 ขั้นตอน)

### ขั้นตอนที่ 1: Apply Database Migration

**วิธีที่ 1 - ใช้ CLI (แนะนำ)**
```bash
npx supabase db push
```

**วิธีที่ 2 - Copy SQL ไป Run เอง**
1. เปิด: https://supabase.com/dashboard/project/nhehjnosjzdczgpjvnmy/editor
2. คลิก SQL Editor
3. Copy ไฟล์นี้ไป Paste: `supabase/migrations/014_create_event_registration_system.sql`
4. กด Run

**ตรวจสอบว่าสำเร็จ:**
```sql
-- ตรวจสอบว่ามี 4 ตารางใหม่
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'event_registration%';

-- ตรวจสอบข้อมูลตัวอย่าง
SELECT * FROM event_registration_settings WHERE event_id = 'event-summit-2026';
```

ต้องเห็น:
- ✅ 4 ตาราง
- ✅ 1 การตั้งค่า
- ✅ 4 ฟอร์มฟิลด์

---

### ขั้นตอนที่ 2: Restart Dev Server

```bash
# หยุด server เดิม (Ctrl+C)
npm run dev
```

รอจน Terminal แสดง:
```
✓ Ready in 1234ms
```

---

### ขั้นตอนที่ 3: ทดสอบ

**เปิดหน้า Event:**
```
http://localhost:2024/events/event-summit-2026
```

**ทดสอบการทำงาน:**
1. ✅ เห็นส่วน "Event Registration" ด้านล่าง Event
2. ✅ เห็นสถิติ "0 / 100" (ยังไม่มีคนลงทะเบียน)
3. ✅ เห็นปุ่ม "Register Now"
4. ✅ กดปุ่ม → ถ้ายัง Login จะพาไป Login
5. ✅ Login แล้วกดปุ่ม → Modal ฟอร์มเปิด
6. ✅ กรอกฟอร์ม → กด Submit
7. ✅ เห็นเลขยืนยัน REG-20261011-XXXX
8. ✅ Modal ปิดเอง หลัง 3 วินาที
9. ✅ ปุ่มเปลี่ยนเป็น "You are Registered ✓"
10. ✅ สถิติเปลี่ยนเป็น "1 / 100"

---

## 🎨 ดูตัวอย่างการออกแบบ

เปิดไฟล์นี้ในเบราว์เซอร์:
```
EVENT_REGISTRATION_DEMO.html
```

จะเห็น:
- สี Theme ที่ใช้
- ทุก State ของปุ่ม
- ฟอร์ม Modal
- Layout บน Mobile/Desktop

---

## 🧪 ทดสอบด้วย Test Script

```bash
node test-registration-integration.js
```

ผลลัพธ์ที่ควรเห็น (หลัง Migration):
```
✅ Passed: 4
❌ Failed: 0
⚠️  Pending: 0
📝 Total: 4
```

---

## 📱 ปุ่มลงทะเบียนมี 7 States

| State | เมื่อไร | ลักษณะ |
|-------|--------|--------|
| 1. **Can Register** | Login แล้ว + เปิดรับ + ยังไม่ได้ลง | ปุ่มฟ้า "Register Now" |
| 2. **Already Registered** | ลงทะเบียนแล้ว | ปุ่มเขียว "✓ You are Registered" |
| 3. **Not Logged In** | ยังไม่ Login | ปุ่มโปร่งใส "Login to Register" |
| 4. **Registration Closed** | หมดเวลาลงทะเบียน | ปุ่ม Disabled สีเทา |
| 5. **Event Full** | คนเต็มแล้ว | ปุ่ม Disabled "Event Full" |
| 6. **Not Started** | ยังไม่เปิดรับ | ปุ่ม Disabled "Registration Opens Soon" |
| 7. **Loading** | กำลังโหลด | ปุ่มมีวงหมุน "Loading..." |

---

## 🔧 ฟอร์มรองรับ 9 ประเภท

1. **text** - ข้อความบรรทัดเดียว
2. **textarea** - ข้อความหลายบรรทัด
3. **email** - Email (มี Validation)
4. **phone** - เบอร์โทร
5. **date** - วันที่
6. **time** - เวลา
7. **select** - Dropdown
8. **radio** - เลือกได้ 1
9. **checkbox** - ติ๊กถูก

Admin สามารถกำหนดได้:
- ข้อความคำถาม
- บังคับตอบหรือไม่
- Placeholder
- ตัวเลือก (สำหรับ select/radio)
- ลำดับการแสดง

---

## 📂 ไฟล์ที่สร้าง/แก้ไข

### สร้างใหม่ (11 ไฟล์)
```
✨ supabase/migrations/014_create_event_registration_system.sql
✨ app/api/events/[id]/registration-fields/route.ts
✨ components/events/RegistrationButton.tsx
✨ components/events/RegistrationModal.tsx
✨ test-registration-integration.js
✨ EVENT_REGISTRATION_DEMO.html
✨ EVENT_REGISTRATION_INTEGRATION_COMPLETE.md
✨ APPLY_MIGRATION.md
✨ FINAL_SUMMARY.md
✨ QUICK_START_TH.md (ไฟล์นี้)
```

### แก้ไข (3 ไฟล์)
```
📝 app/events/[slug]/page.tsx (เพิ่ม Registration Section)
📝 app/api/events/[id]/registration-settings/route.ts
📝 app/api/events/[id]/registration-status/route.ts
```

---

## ✅ Checklist ก่อนใช้งานจริง

- [ ] Apply Database Migration สำเร็จ
- [ ] Restart Dev Server แล้ว
- [ ] เปิดหน้า Event เห็น Registration Section
- [ ] Login แล้วกดปุ่มได้
- [ ] Modal เปิดขึ้นมา
- [ ] ฟอร์มกรอกได้
- [ ] Submit แล้วได้เลขยืนยัน
- [ ] Modal ปิดเอง
- [ ] ปุ่มเปลี่ยนเป็น "Already Registered"
- [ ] สถิติอัปเดต

---

## 🎯 Event ที่มีข้อมูลตัวอย่าง

**Event ID:** `event-summit-2026`  
**ชื่อ:** EFSW Regional Summit 2026  
**URL:** http://localhost:2024/events/event-summit-2026

**การตั้งค่า:**
- ✅ เปิดรับลงทะเบียน
- 📅 เริ่ม: วันนี้
- 📅 สิ้นสุด: อีก 30 วัน
- 👥 จำนวนที่รับ: 100 คน

**ฟอร์ม (4 ฟิลด์):**
1. Full Name (บังคับ)
2. Email Address (บังคับ)
3. Organization (ไม่บังคับ)
4. Dietary Requirements (ไม่บังคับ)

---

## 🚀 ใช้งานกับ Event อื่นได้ไหม?

**ได้!** แค่เพิ่มข้อมูลใน Database:

```sql
-- เปิดการลงทะเบียนสำหรับ Event ใหม่
INSERT INTO event_registration_settings (event_id, registration_enabled, max_attendees)
VALUES ('event-webinar-youth', true, 50);

-- เพิ่มฟอร์มฟิลด์
INSERT INTO event_registration_fields (event_id, field_name, field_type, field_label, required, display_order)
VALUES 
  ('event-webinar-youth', 'name', 'text', 'Full Name', true, 1),
  ('event-webinar-youth', 'email', 'email', 'Email', true, 2);
```

---

## 🔐 ความปลอดภัย

- ✅ ต้อง Login ก่อนถึงลงทะเบียนได้
- ✅ Row Level Security (RLS) - เห็นได้แค่ของตัวเอง
- ✅ API มี Validation
- ✅ เลขยืนยันสร้างจาก Server (ไม่ซ้ำ)
- ✅ ป้องกัน SQL Injection

---

## 📖 เอกสารเพิ่มเติม

- **ภาพรวม Implementation:** `FINAL_SUMMARY.md` (ภาษาอังกฤษ)
- **รายละเอียดทางเทค:** `EVENT_REGISTRATION_INTEGRATION_COMPLETE.md`
- **วิธี Apply Migration:** `APPLY_MIGRATION.md`
- **ตัวอย่างสี Layout:** `EVENT_REGISTRATION_DEMO.html`

---

## 💡 Tips

1. **ถ้า API Error 500** = ยังไม่ได้ Apply Migration
2. **ถ้า 404** = Event ID ไม่ถูก หรือยังไม่มีในระบบ
3. **ถ้า 401** = ต้อง Login ก่อน (ถูกต้องแล้ว)
4. **ถ้าปุ่มไม่เปลี่ยน** = ลอง Refresh หน้า
5. **ถ้า Modal ไม่เปิด** = เช็ค Console มี Error ไหม

---

## 🎉 สรุป

ระบบลงทะเบียน Event **พร้อมใช้งาน 100%**

เหลือแค่:
1. Apply Database Migration (1 คำสั่ง หรือ Copy SQL)
2. Restart Server
3. ทดสอบ

**เวลาที่ใช้:** ~5-10 นาที  
**ความยาก:** ⭐⭐☆☆☆ (ง่าย)

---

**สร้างเมื่อ:** 11 ตุลาคม 2026  
**สถานะ:** ✅ เสร็จสมบูรณ์ - รอ Apply Migration
