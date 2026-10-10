# รายงานการตรวจสอบระบบจัดการ Content ใน Admin Console

## สรุปผลการตรวจสอบ

### 1. ✅ **Admin Content Management** (CRUD ครบถ้วน - บันทึกจริงใน Supabase)

**Status: ใช้งานได้เต็มรูปแบบ**

**UI Components:**
- `/components/admin/views/AdminContentView.tsx` - มี UI สำหรับจัดการ content ครบถ้วน
- `/components/admin/modals/ContentEditorModal.tsx` - มี modal editor พร้อม form fields ครบทุกฟิลด์

**CRUD Operations:**
- ✅ **CREATE**: `saveAdminContentRemote()` → POST `/api/content`
- ✅ **READ**: `getAdminContent()` + `syncAdminContent()` → GET `/api/content`
- ✅ **UPDATE**: `saveAdminContentRemote()` → POST `/api/content` (upsert)
- ✅ **DELETE**: `deleteAdminContentRemote()` → DELETE `/api/content?id=xxx`

**API Endpoints (ทำงานจริง):**
- `POST /api/content` - สร้าง/อัปเดต content (มี auth check: admin/pr role)
- `GET /api/content` - ดึงข้อมูล content
- `PATCH /api/content` - แก้ไขบางฟิลด์
- `DELETE /api/content?id=xxx` - ลบ content
- `POST /api/content/bulk` - bulk operations (delete, updateStatus, updateCategory)

**Data Persistence:**
- ✅ **Dual-layer**: localStorage (optimistic) + Supabase (source of truth)
- ✅ **Auto-sync**: `syncAdminContent()` ดึงข้อมูลจาก Supabase เมื่อโหลดหน้า
- ✅ **Optimistic updates**: บันทึก localStorage ทันที แล้วค่อย push ไป Supabase
- ✅ **Error handling**: มี callback `onError` สำหรับแจ้งเตือนเมื่อ Supabase fail

**Form Fields ที่มี:**
- ✅ Title, Summary, Body (TipTap WYSIWYG editor)
- ✅ Kind (news/document/event/academic)
- ✅ Status (draft/published/archived)
- ✅ Locale (en/th/ko)
- ✅ Category, Author, Tags
- ✅ Cover image upload (R2 storage)
- ✅ Image caption/alt text
- ✅ **Cover image crop** - มี API `/api/content/[id]/cover-crop` (POST/GET/DELETE)
- ✅ **Gallery images** - มี API `/api/content/[id]/gallery` (POST/GET/DELETE)
- ✅ Event fields (startsAt, endsAt, venue, format, registrationUrl)
- ✅ Visibility window (publishAt, expiresAt)
- ✅ Audience targeting (targetMembershipTypes, targetGroups)
- ✅ Hero slider settings (showInHeroSlider, sliderDuration, sliderOrder)
- ✅ SEO metadata (seoTitle, seoDescription, seoKeywords, ogImage, canonicalUrl)

**Advanced Features:**
- ✅ Bulk selection + bulk actions (delete, publish, archive, set category)
- ✅ Auto-archive expired content
- ✅ Filter by kind, status, search
- ✅ View count tracking
- ✅ Scheduled publishing (publishAt)

---

### 2. ⚠️ **Admin Layout Management** (มี UI + localStorage แต่ไม่มี API)

**Status: ใช้งานได้บางส่วน (localStorage เท่านั้น)**

**UI Components:**
- `/components/admin/views/AdminLayoutView.tsx` - มี UI สำหรับแก้ไข:
  - Hero section (scenes, headline, CTA)
  - Leadership profiles
  - Executive board
  - Organization history
  - Partner logos
  - Home sections copy
  - Footer
  - Organization page data
  - Library categories
  - Section visibility toggles

**Data Persistence:**
- ✅ **localStorage only**: `saveAdminLayout()` บันทึกใน `efsw.admin.layout`
- ❌ **No API**: ไม่มี `/api/layout` endpoint
- ⚠️ **Limitation**: ข้อมูลจะหายเมื่อ clear browser cache หรือเปลี่ยน device

**What Works:**
- ✅ UI สามารถแก้ไขได้ทุกฟิลด์
- ✅ บันทึกลง localStorage ได้
- ✅ หน้าเว็บ public อ่านค่าจาก localStorage แสดงผล
- ✅ Upload images to R2 (hero scenes, history items, partner logos)

**What's Missing:**
- ❌ ไม่มี Supabase table สำหรับ layout config
- ❌ ไม่มี API endpoint สำหรับบันทึก layout
- ❌ ข้อมูลไม่ persistent across devices/browsers

---

### 3. ✅ **Content Editor Modal** (ครบถ้วน)

**Status: ใช้งานได้เต็มรูปแบบ**

**Features:**
- ✅ All form fields working
- ✅ TipTap rich text editor for body content
- ✅ Cover image upload + drag-drop
- ✅ Image crop modal (`CoverImageCropper`)
- ✅ Gallery manager (`GalleryManager`) - multi-image upload
- ✅ Validation (required fields, date range checks)
- ✅ Save triggers `saveAdminContentRemote()` → Supabase
- ✅ Delete triggers `deleteAdminContentRemote()` → Supabase

---

### 4. ✅ **API Endpoints สำหรับบันทึกข้อมูล** (ครบถ้วน)

**Content APIs:**
- ✅ `POST /api/content` - create/update content (auth: admin/pr)
- ✅ `GET /api/content` - list content (with filters)
- ✅ `PATCH /api/content` - partial update
- ✅ `DELETE /api/content?id=xxx` - hard delete (auth: admin/pr)
- ✅ `POST /api/content/bulk` - bulk operations
- ✅ `POST /api/content/[id]/cover-crop` - save crop settings
- ✅ `GET /api/content/[id]/cover-crop` - get crop settings
- ✅ `DELETE /api/content/[id]/cover-crop` - remove crop
- ✅ `POST /api/content/[id]/gallery` - upload gallery image
- ✅ `GET /api/content/[id]/gallery` - list gallery images
- ✅ `DELETE /api/content/[id]/gallery?imageId=xxx` - delete gallery image
- ✅ `POST /api/content/[id]/gallery/reorder` - reorder gallery images

**Layout APIs:**
- ❌ **None** - Layout config บันทึกเฉพาะ localStorage

---

### 5. ✅ **Data Persistence** (Content: ดีเยี่ยม | Layout: พอใช้)

**Content:**
- ✅ **Primary storage**: Supabase `content` table
- ✅ **Local cache**: localStorage `efsw.admin.content`
- ✅ **Sync strategy**: Remote wins on conflict
- ✅ **Optimistic updates**: บันทึก localStorage ทันที, Supabase asynchronously
- ✅ **Error recovery**: เก็บ local data เมื่อ Supabase fail
- ✅ **Auto-archive**: content ที่หมดอายุจะถูก archive อัตโนมัติ

**Layout:**
- ⚠️ **Primary storage**: localStorage `efsw.admin.layout` เท่านั้น
- ❌ **No remote backup**: ข้อมูลจะหายเมื่อ clear cache
- ✅ **Default fallback**: มี `defaultLayoutConfig` เป็นค่าเริ่มต้น

---

## สรุประบบที่ใช้งานได้/ไม่ได้

### ✅ ระบบที่ใช้งานได้เต็มรูปแบบ (มี API + UI + Persistence)

1. **Content Management (CRUD)**
   - สร้าง/แก้ไข/ลบ content ทุก kind (news/document/event/academic)
   - บันทึกลง Supabase table `content`
   - มี API endpoints ครบทุก operation
   - มี authentication/authorization (admin/pr roles)
   
2. **Content Editor**
   - Rich text editor (TipTap)
   - Cover image upload + crop
   - Gallery management (multiple images)
   - SEO metadata
   - Event-specific fields
   - Audience targeting
   - Scheduled publishing

3. **Bulk Operations**
   - Bulk select/deselect
   - Bulk delete
   - Bulk status change
   - Bulk category update

4. **Content Categories**
   - Create/edit/reorder filter categories
   - บันทึกลง localStorage (ยังไม่มี remote API)

---

### ⚠️ ระบบที่ใช้งานได้บางส่วน (มี UI แต่ไม่มี API)

1. **Layout Management**
   - มี UI ครบถ้วน (hero, leadership, board, history, partners, footer, etc.)
   - บันทึกได้แค่ localStorage
   - **ไม่มี Supabase table**
   - **ไม่มี API endpoints**
   - ข้อมูลไม่ persistent across devices/browsers

---

### ❌ ระบบที่ยังไม่มีจริง

- ไม่มี (ทุกระบบหลักมีอย่างน้อย localStorage persistence)

---

## แนะนำสิ่งที่ควรสร้าง/แก้ไข

### 🔴 สำคัญมาก (Critical)

1. **สร้าง Supabase table สำหรับ Layout config**
   ```sql
   CREATE TABLE layout_config (
     id TEXT PRIMARY KEY DEFAULT 'default',
     config JSONB NOT NULL,
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **สร้าง API endpoint `/api/layout`**
   - `GET /api/layout` - ดึง config
   - `POST /api/layout` - บันทึก config (admin only)
   
3. **แก้ไข `lib/admin-data.ts`**
   - เพิ่ม `saveAdminLayoutRemote()` แบบ `saveAdminContentRemote()`
   - เพิ่ม `syncAdminLayout()` ให้ดึงจาก Supabase

### 🟡 สำคัญปานกลาง (Nice to have)

4. **Content Categories API**
   - สร้าง Supabase table `content_categories`
   - สร้าง API `/api/content/categories`
   - ทำให้ filter categories sync ข้าม devices

5. **Image optimization**
   - ตอนนี้ใช้ sharp compress ใน `/api/content/[id]/gallery`
   - ควรใช้ pattern เดียวกันกับ cover image upload

### 🟢 Enhancement

6. **Activity logging to database**
   - ตอนนี้ activity log เก็บแค่ localStorage
   - ควรเก็บลง Supabase เพื่อ audit trail

7. **Version history**
   - เก็บ content revisions
   - Rollback feature

---

## Code ที่ยืนยันว่าระบบทำงานจริง

### Content CRUD (✅ ใช้งานได้จริง)

**Save function** (`/lib/admin-data.ts:1008-1024`):
```typescript
export async function saveAdminContentRemote(
  item: AdminContentItem,
  onError?: (message: string) => void
): Promise<AdminContentItem[]> {
  // 1) Optimistic local write
  const next = saveAdminContent(item);
  
  // 2) Push to Supabase
  try {
    await pushContentRow(item);
  } catch (err: any) {
    onError?.(err?.message || "Failed to save to database");
  }
  return next;
}
```

**API endpoint** (`/app/api/content/route.ts:228-267`):
```typescript
export async function POST(req: NextRequest) {
  // Auth check
  await requireRole(req, ["admin", "pr"]);
  
  // Parse + validate
  const row = rowFromPayload(payload);
  
  // Upsert to Supabase
  const query = existing
    ? supabaseAdmin.from("content").update(row)...
    : supabaseAdmin.from("content").insert(row)...
    
  return NextResponse.json({ item: payloadFromRow(data) });
}
```

**Wire-up** (`/app/admin/page.tsx:208-221`):
```typescript
const handleSaveContent = useCallback(async (item: AdminContentItem) => {
  const updatedList = await saveAdminContentRemote(item, (errorMsg) => {
    notify(`Database error: ${errorMsg}`);
  });
  setContent(updatedList);
  // ... logging + toast
}, [content, logActivity, notify]);
```

### Layout Management (⚠️ localStorage เท่านั้น)

**Save function** (`/lib/admin-data.ts:1436`):
```typescript
export const saveAdminLayout = (layout: AdminLayoutConfig) => {
  write(ADMIN_LAYOUT_KEY, layout);
};
```

❌ **ไม่มี** `saveAdminLayoutRemote()` หรือ API endpoint

---

## สรุป

- **Content Management**: ✅ ระบบสมบูรณ์ - มี CRUD ครบ, API ครบ, บันทึกลง Supabase, มี auth, มี error handling
- **Layout Management**: ⚠️ ใช้งานได้แต่ไม่ persistent - มี UI ครบแต่บันทึกแค่ localStorage, ควรสร้าง API + Supabase table ด่วน
- **Content Editor**: ✅ Modal editor ใช้งานได้เต็มรูปแบบ พร้อม validation, image upload, gallery, crop
- **Data Persistence**: ✅ Content = excellent (Supabase), ⚠️ Layout = fair (localStorage only)

**คำแนะนำหลัก**: สร้าง `/api/layout` endpoint + Supabase table เพื่อให้ Layout config persistent ข้าม devices/browsers เหมือน Content management
