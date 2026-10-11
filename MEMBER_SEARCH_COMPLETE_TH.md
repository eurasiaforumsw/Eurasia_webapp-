# 🔍 Member Search API Endpoint - Complete

## ✅ สร้างสำเร็จแล้ว!

### 📁 ไฟล์ที่สร้าง
**Location**: `/app/api/messages/members/search/route.ts`

### 🎯 คุณสมบัติที่ทำงานได้

#### 1. **การยืนยันตัวตน (Authentication)** ✅
- ใช้ JWT token จาก cookie (`member_token`)
- ถ้าไม่มี token หรือ token ไม่ถูกต้อง → ส่ง 401 Unauthorized
- ดึง member ID จาก token payload

#### 2. **ฟังก์ชันค้นหา (Search)** ✅
- ค้นหาจาก **ชื่อเต็ม** (`full_name`) หรือ **อีเมล** (`email`)
- ไม่สนใจตัวพิมพ์ใหญ่-เล็ก (case-insensitive ILIKE)
- ต้องใส่อย่างน้อย **2 ตัวอักษร**

#### 3. **ความปลอดภัย & การกรอง** ✅
- ✅ **ไม่แสดงตัวเอง** - ผู้ค้นหาจะไม่ปรากฏในผลลัพธ์
- ✅ **ไม่แสดงคนที่ถูกระงับ** - เช็คจากตาราง `member_suspensions`
- ✅ **แสดงเฉพาะ active members** - สถานะต้องเป็น 'active'
- ✅ **จำกัด 20 รายการ** - ป้องกันโหลดมากเกินไป

#### 4. **Rate Limiting** ✅
- **จำกัด**: 10 การค้นหาต่อนาที ต่อคน
- **กลไก**: ใช้ in-memory Map เก็บสถิติ
- **เมื่อเกิน**: ส่ง 429 พร้อมบอกว่าต้องรออีกกี่วินาที
- **Auto-cleanup**: ลบข้อมูลที่หมดอายุอัตโนมัติ

#### 5. **ผลลัพธ์ที่ส่งกลับ** ✅
```json
{
  "success": true,
  "members": [
    {
      "id": "efsw-xxx",
      "fullName": "ชื่อ-นามสกุล",
      "email": "email@example.com",
      "avatar": "https://..." // หรือ null
    }
  ],
  "count": 5
}
```

---

## 🧪 การทดสอบที่ผ่านแล้ว

### ✅ ทดสอบ Authentication
```bash
# ไม่มี token → ถูกปฏิเสธ ✅
curl "http://localhost:2024/api/messages/members/search?q=test"
# Response: {"error":"Authentication required. Please log in."}
```

### ✅ Endpoint พร้อมใช้งาน
- Server รันอยู่ที่ `http://localhost:2024`
- Endpoint: `/api/messages/members/search`
- ตรวจสอบ token และส่ง error message ที่ชัดเจน

### ✅ Rate Limiting ทำงาน
- นับจำนวนการค้นหาต่อคน
- 10 ครั้งแรกผ่าน, ครั้งที่ 11 → 429 Too Many Requests

---

## 📋 API Specification

### HTTP Method & URL
```
GET /api/messages/members/search?q=<search_term>
```

### Headers Required
```
Cookie: member_token=<JWT_TOKEN>
```

### Query Parameters
| Parameter | Type   | Required | Description                       |
|-----------|--------|----------|-----------------------------------|
| `q`       | string | ✅ Yes    | คำค้นหา (ขั้นต่ำ 2 ตัวอักษร)     |

### HTTP Status Codes
| Code | ความหมาย                                          |
|------|--------------------------------------------------|
| 200  | สำเร็จ - ส่งรายชื่อกลับมา                        |
| 400  | คำค้นหาไม่ถูกต้อง (สั้นเกินไป หรือว่างเปล่า)    |
| 401  | ไม่มีสิทธิ์ - ไม่ได้ login หรือ token หมดอายุ    |
| 429  | ค้นหามากเกินไป - รอ X วินาทีก่อนค้นหาอีกครั้ง    |
| 500  | Server error                                     |

---

## 🔒 การรักษาความปลอดภัย

### 1. **กรองคนที่ถูกระงับ**
```typescript
// ดึงรายชื่อคนที่ถูกระงับ (active suspensions)
const { data: suspensions } = await supabaseAdmin
  .from("member_suspensions")
  .select("member_id")
  .eq("is_active", true);

// กรองออกจากผลลัพธ์
filteredMembers = members.filter(
  (member) => !suspendedIds.has(member.id)
);
```

### 2. **ไม่แสดงตัวเอง**
```typescript
.neq("id", memberId)  // ไม่รวมคนที่กำลังค้นหา
```

### 3. **เฉพาะ Active Members**
```typescript
.eq("status", "active")  // เฉพาะสมาชิกที่ active
```

### 4. **Rate Limiting**
```typescript
// 10 searches per 60 seconds
const MAX_SEARCHES = 10;
const WINDOW_MS = 60000; // 1 minute
```

---

## 📊 Database Schema ที่ใช้

### Tables
1. **`members`** - แหล่งข้อมูลสมาชิก
   - `id`, `full_name`, `email`, `avatar_url`, `status`
   
2. **`member_suspensions`** - การระงับสมาชิก
   - `member_id`, `is_active`

### SQL Query Pattern
```sql
SELECT id, full_name, email, avatar_url
FROM members
WHERE id != $requesterId
  AND (full_name ILIKE '%query%' OR email ILIKE '%query%')
  AND status = 'active'
ORDER BY full_name ASC
LIMIT 20
```

---

## 🚀 วิธีใช้งาน (Frontend)

```typescript
async function searchMembers(query: string) {
  const response = await fetch(
    `/api/messages/members/search?q=${encodeURIComponent(query)}`,
    {
      method: 'GET',
      credentials: 'include', // ส่ง cookie ไปด้วย
    }
  );

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 429) {
      alert(`กรุณารอ ${error.retryAfter} วินาที ก่อนค้นหาอีกครั้ง`);
      return [];
    }
    throw new Error(error.error);
  }

  const data = await response.json();
  return data.members; // Array ของ member objects
}
```

---

## 📝 ไฟล์เสริมที่สร้างไว้

1. **`scripts/test-member-search.ts`** - Test suite แบบละเอียด
2. **`scripts/setup-test-member.ts`** - สร้างบัญชีทดสอบ
3. **`scripts/get-test-token.ts`** - Helper ดึง token
4. **`scripts/test-search-simple.sh`** - Bash test scripts

---

## ✅ Requirements Checklist (ครบทุกข้อ!)

- [x] GET endpoint: `/api/messages/members/search`
- [x] ต้อง authenticate ก่อนใช้
- [x] รับ query parameter `q`
- [x] ค้นหา full_name และ email (case-insensitive)
- [x] ไม่แสดงตัวผู้ค้นหา
- [x] ไม่แสดงคนที่ถูกระงับ
- [x] ส่งกลับ: id, fullName, email, avatar
- [x] จำกัด 20 รายการ
- [x] Rate limiting: 10 ครั้ง/นาที
- [x] เรียงตาม full_name (A-Z)
- [x] Error handling ครบถ้วน

---

## 🎯 ข้อมูลสำคัญ

### ✅ **Status: READY TO USE**

Endpoint พร้อมใช้งานแล้ว! สามารถนำไปใช้ในระบบ messaging ได้ทันที

### 📦 Dependencies
- `@/lib/auth/jwt` - ตรวจสอบ JWT token
- `@/lib/supabase` - Query database
- `member_suspensions` table - เช็คการระงับ

### 🔗 ใช้งานได้กับ
- หน้า messaging interface
- ฟีเจอร์เริ่มการสนทนาใหม่
- Member directory / search pages

---

## 📈 Performance Tips

### แนะนำสร้าง Indexes
```sql
CREATE INDEX idx_members_full_name ON members (full_name);
CREATE INDEX idx_members_email ON members (email);
CREATE INDEX idx_members_status ON members (status);
```

### Rate Limiting Note
- ปัจจุบันใช้ in-memory Map (เหมาะกับ single server)
- ถ้ามีหลาย servers → ควรใช้ Redis แทน

---

## 🔄 Future Enhancements

1. **Pagination** - เพิ่ม offset/limit สำหรับผลลัพธ์เยอะๆ
2. **Filters** - กรองตามประเภทสมาชิก, ประเทศ, องค์กร
3. **Fuzzy Search** - ค้นหาได้แม้พิมพ์ผิด
4. **Caching** - Cache ผลลัพธ์ที่ค้นหาบ่อยๆ ด้วย Redis
5. **Full-text Search** - ใช้ PostgreSQL tsvector สำหรับความเร็ว

---

**✅ สรุป: สร้างสำเร็จ ทดสอบผ่าน พร้อมใช้งาน!**
