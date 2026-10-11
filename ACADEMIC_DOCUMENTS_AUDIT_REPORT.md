# รายงานการตรวจสอบระบบ Academic Documents

**วันที่ตรวจสอบ:** 11 ตุลาคม 2026  
**ผู้ตรวจสอบ:** Claude Code (Opus 5.5)

---

## สรุปผลการตรวจสอบ

### ✅ **สิ่งที่ใช้งานได้ดีแล้ว**

#### 1. หน้า Academic Documents (Public View)
**ตำแหน่ง:** `/app/academic-documents/page.tsx`

**ฟีเจอร์ที่มี:**
- ✅ แสดงรายการเอกสาร academic จาก admin content (kind: "academic")
- ✅ มี 3 หมวดหมู่: Research Papers, Practice Guides, Policy Briefings
- ✅ ระบบกรอง (Filter) ตามหมวดหมู่และ tags
- ✅ ระบบเรียงลำดับ: Newest, Oldest, Most Downloaded, Title A-Z
- ✅ Search bar สำหรับค้นหาเอกสาร
- ✅ แสดง engagement metrics (downloads, views, likes)
- ✅ Document cards พร้อม metadata (author, date, tags, page count)
- ✅ Responsive design (mobile, tablet, desktop)

**Components:**
- ✅ `AuthorMarquee` - แสดงผู้เขียนแบบเลื่อนต่อเนื่อง
- ✅ `DocumentCard` - การ์ดแสดงข้อมูลเอกสาร
- ✅ `StickyDocumentFilters` - ตัวกรองแบบติดด้านบน

---

#### 2. Author Marquee Component
**ตำแหน่ง:** `/components/academic/AuthorMarquee.tsx`

**การทำงาน:**
- ✅ **Animation ถูกต้อง:** ใช้ `transform: translateX()` แทน `left/right` → GPU acceleration
- ✅ **Infinite Loop:** Duplicate array เพื่อเลื่อนต่อเนื่องไม่มีจุดหยุด
- ✅ **Pause on Hover:** หยุด animation เมื่อ hover
- ✅ **Performance:** ใช้ `will-change: transform` เพื่อ optimize
- ✅ **Responsive:** ปรับขนาดได้ตามหน้าจอ

**CSS Animation:**
```css
@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.author-marquee__track {
  animation: marquee-scroll 60s linear infinite;
  will-change: transform;
}
```

**คุณภาพ:** ⭐⭐⭐⭐⭐ (5/5) - ทำงานได้สมบูรณ์และ smooth

---

#### 3. Admin Content Management
**ตำแหน่ง:** `/app/admin/page.tsx`, `/components/admin/modals/ContentEditorModal.tsx`

**ฟีเจอร์ที่มี:**
- ✅ สร้าง content type "academic" ได้
- ✅ แก้ไข title, summary, body (rich text editor)
- ✅ เลือกหมวดหมู่ (Research/Practice/Briefings)
- ✅ อัปโหลด cover image
- ✅ จัดการ tags
- ✅ กำหนด author
- ✅ เลือกสถานะ (draft/published/archived)
- ✅ กำหนดวันเผยแพร่ (publishAt)
- ✅ SEO metadata
- ✅ Audience targeting (member-only หรือ public)

---

### ⚠️ **สิ่งที่ขาดและควรเพิ่ม**

#### 1. ❌ การอัปโหลดไฟล์ PDF/Document

**ปัญหา:**
- ❌ ไม่มีฟิลด์สำหรับอัปโหลดไฟล์จริง (PDF, DOC, DOCX)
- ❌ `AdminContentItem` type ไม่มี field: `fileUrl`, `fileName`, `fileSize`, `fileType`
- ❌ ไม่มี API endpoint สำหรับอัปโหลดไฟล์เอกสาร
- ❌ ไม่มีปุ่ม Download ในหน้า public

**ผลกระทบ:**
- ผู้ใช้ไม่สามารถดาวน์โหลดไฟล์เอกสารได้จริง
- Admin ไม่สามารถอัปโหลดไฟล์ PDF ได้
- ข้อมูล `downloads` เป็นค่า mock (random) ไม่ใช่ข้อมูลจริง

---

#### 2. ❌ Database Schema ไม่สมบูรณ์

**ฟิลด์ที่ควรมีใน `content` table:**
```sql
ALTER TABLE content
ADD COLUMN file_url TEXT,
ADD COLUMN file_name TEXT,
ADD COLUMN file_size BIGINT,
ADD COLUMN file_type TEXT,
ADD COLUMN download_count INTEGER DEFAULT 0;
```

---

#### 3. ⚠️ Download Counter ไม่ทำงาน

**ปัญหา:**
- มีฟังก์ชัน `incrementDownloadCount()` แต่ไม่มีที่เก็บข้อมูลจริง
- ข้อมูล downloads เป็น mock: `Math.floor(Math.random() * 500) + 50`

---

## แนวทางแก้ไข

### Phase 1: เพิ่มการอัปโหลดไฟล์ (สำคัญมาก)

#### 1.1 แก้ไข Database Schema

สร้างไฟล์ `/supabase/migrations/014_add_content_file_fields.sql`:

```sql
-- Migration: Add file fields to content table
-- Created: 2026-10-11

ALTER TABLE content
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

-- Create index for filtering by file type
CREATE INDEX IF NOT EXISTS idx_content_file_type ON content(file_type) WHERE file_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN content.file_url IS 'URL of uploaded file (PDF, DOC, etc.) stored in R2/Blob';
COMMENT ON COLUMN content.file_name IS 'Original filename';
COMMENT ON COLUMN content.file_size IS 'File size in bytes';
COMMENT ON COLUMN content.file_type IS 'MIME type (application/pdf, application/msword, etc.)';
COMMENT ON COLUMN content.download_count IS 'Number of times this file was downloaded';
```

---

#### 1.2 แก้ไข TypeScript Type

แก้ไข `/lib/admin-data.ts`:

```typescript
export type AdminContentItem = {
  id: string;
  kind: AdminContentKind;
  category: string;
  title: string;
  summary: string;
  body: string;
  coverImage?: string;
  coverImageCrop?: CoverImageCrop;
  imageCaption?: string;
  author?: string;
  tags?: string[];
  status: AdminContentStatus;
  locale: ContentLocale;
  updatedAt: string;
  
  // ✅ เพิ่มฟิลด์ไฟล์
  fileUrl?: string;        // URL ของไฟล์บน R2/Vercel Blob
  fileName?: string;       // ชื่อไฟล์ต้นฉบับ
  fileSize?: number;       // ขนาดไฟล์ (bytes)
  fileType?: string;       // MIME type
  downloadCount?: number;  // จำนวนดาวน์โหลด
  
  startsAt?: string;
  endsAt?: string;
  venue?: string;
  format?: string;
  registrationUrl?: string;
  publishAt?: string;
  expiresAt?: string;
  targetMembershipTypes?: ("professional" | "student" | "institutional")[];
  targetGroups?: string[];
  viewCount?: number;
  likeCount?: number;
  likedBy?: string[];
  showInHeroSlider?: boolean;
  sliderDuration?: number;
  sliderOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
};
```

---

#### 1.3 สร้าง API สำหรับอัปโหลดไฟล์

สร้างไฟล์ `/app/api/content/[id]/file/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * POST /api/content/[id]/file
 * Upload document file (PDF, DOC, DOCX) to R2 storage
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verify admin auth
    const token = req.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get file from form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 3. Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword", // .doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.ms-excel", // .xls
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX allowed." },
        { status: 400 }
      );
    }

    // 4. Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    // 5. Generate unique filename
    const ext = file.name.split(".").pop();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const key = `documents/${params.id}/${timestamp}-${randomStr}.${ext}`;

    // 6. Upload to R2
    const buffer = await file.arrayBuffer();
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: Buffer.from(buffer),
        ContentType: file.type,
      })
    );

    const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    // 7. Update content record
    const { error: dbError } = await supabaseAdmin
      .from("content")
      .update({
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (dbError) {
      return NextResponse.json(
        { error: "Failed to update database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error) {
    console.error("[API] File upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/content/[id]/file
 * Remove file from content
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from("content")
      .update({
        file_url: null,
        file_name: null,
        file_size: null,
        file_type: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to remove file" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

#### 1.4 แก้ไข ContentEditorModal เพิ่ม File Upload UI

แก้ไข `/components/admin/modals/ContentEditorModal.tsx` เพิ่มหลังส่วน Cover Image:

```tsx
{/* File Upload Section (for academic/document types) */}
{(draft.kind === "academic" || draft.kind === "document") && (
  <div style={{ display: "grid", gap: "0.5rem", marginTop: "1.5rem" }}>
    <label style={{ color: "var(--admin-muted)", fontSize: "0.72rem", fontWeight: 750 }}>
      Document File
    </label>
    
    {draft.fileUrl ? (
      <div
        style={{
          padding: "1rem",
          background: "var(--admin-card-bg)",
          border: "1px solid var(--admin-border)",
          borderRadius: "var(--admin-radius-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <FileText size={20} style={{ color: "var(--admin-primary)" }} />
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              {draft.fileName}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--admin-muted)" }}>
              {(draft.fileSize! / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRemoveFile}
          style={{
            padding: "0.5rem",
            background: "var(--admin-danger-bg)",
            color: "var(--admin-danger)",
            border: "none",
            borderRadius: "var(--admin-radius-sm)",
            cursor: "pointer",
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    ) : (
      <div>
        <input
          type="file"
          id="file-upload"
          accept=".pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
        <label
          htmlFor="file-upload"
          style={{
            display: "block",
            padding: "2rem",
            background: "var(--admin-input-bg)",
            border: "2px dashed var(--admin-border)",
            borderRadius: "var(--admin-radius-md)",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <UploadCloud size={32} style={{ margin: "0 auto 0.5rem", color: "var(--admin-muted)" }} />
          <div style={{ fontSize: "0.875rem", color: "var(--admin-muted)" }}>
            Click to upload PDF, DOC, or DOCX
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--admin-muted)", marginTop: "0.25rem" }}>
            Maximum file size: 50MB
          </div>
        </label>
      </div>
    )}
  </div>
)}
```

เพิ่ม handler functions:

```tsx
const [fileUploading, setFileUploading] = useState(false);

const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setFileUploading(true);
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/content/${draft.id}/file`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload file");
    }

    const data = await response.json();
    setDraft({
      ...draft,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileType: data.fileType,
    });

    addToast({
      type: "success",
      title: "File uploaded",
      description: `${data.fileName} uploaded successfully`,
    });
  } catch (error) {
    addToast({
      type: "error",
      title: "Upload failed",
      description: error instanceof Error ? error.message : "Failed to upload file",
    });
  } finally {
    setFileUploading(false);
  }
};

const handleRemoveFile = async () => {
  try {
    const response = await fetch(`/api/content/${draft.id}/file`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to remove file");
    }

    setDraft({
      ...draft,
      fileUrl: undefined,
      fileName: undefined,
      fileSize: undefined,
      fileType: undefined,
    });

    addToast({
      type: "success",
      title: "File removed",
      description: "Document file has been removed",
    });
  } catch (error) {
    addToast({
      type: "error",
      title: "Remove failed",
      description: "Failed to remove file",
    });
  }
};
```

---

### Phase 2: เพิ่มปุ่ม Download ในหน้า Public

#### 2.1 แก้ไข DocumentCard Component

แก้ไข `/components/academic/DocumentCard.tsx` เพิ่มปุ่ม Download:

```tsx
{/* Add download button */}
{document.fileUrl && (
  <a
    href={document.fileUrl}
    download={document.fileName}
    onClick={(e) => {
      e.stopPropagation();
      handleDownload(document.id);
    }}
    className="document-card__download-btn"
  >
    <Download size={16} />
    Download {document.fileType === "application/pdf" ? "PDF" : "Document"}
  </a>
)}
```

#### 2.2 สร้าง API สำหรับนับ Downloads

สร้าง `/app/api/content/[id]/download/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/content/[id]/download
 * Increment download count
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin.rpc("increment_download_count", {
      content_id: params.id,
    });

    if (error) {
      console.error("Failed to increment download count:", error);
      return NextResponse.json(
        { error: "Failed to track download" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### 2.3 สร้าง Postgres Function

เพิ่มใน migration file:

```sql
-- Create function to increment download count
CREATE OR REPLACE FUNCTION increment_download_count(content_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE content
  SET download_count = COALESCE(download_count, 0) + 1
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## สรุปความสมบูรณ์

| ฟีเจอร์ | สถานะ | คะแนน |
|---------|-------|-------|
| **หน้า Public Academic Documents** | ✅ สมบูรณ์ | 5/5 |
| **Marquee Animation** | ✅ สมบูรณ์ | 5/5 |
| **Document Card Display** | ✅ สมบูรณ์ | 5/5 |
| **Filter & Search** | ✅ สมบูรณ์ | 5/5 |
| **Admin Create/Edit Content** | ✅ สมบูรณ์ | 5/5 |
| **File Upload (Admin)** | ❌ ยังไม่มี | 0/5 |
| **File Download (Public)** | ❌ ยังไม่มี | 0/5 |
| **Download Counter** | ⚠️ Mock data | 1/5 |
| **Mobile Responsive** | ✅ สมบูรณ์ | 5/5 |

**คะแนนรวม:** 31/45 (68.9%)

---

## การดำเนินการต่อ

### ลำดับความสำคัญ:

1. **🔴 สูงสุด (Critical):**
   - เพิ่มการอัปโหลดไฟล์ PDF/Document ใน Admin
   - สร้าง API `/api/content/[id]/file`
   - แก้ไข Database schema

2. **🟡 สูง (High):**
   - เพิ่มปุ่ม Download ในหน้า public
   - สร้าง Download counter ที่ทำงานจริง

3. **🟢 ปานกลาง (Medium):**
   - แสดงจำนวน downloads จริงแทน mock data
   - เพิ่ม preview สำหรับไฟล์ PDF (iframe หรือ PDF.js)

---

## คำแนะนำสำหรับผู้ใช้

**ถ้าต้องการใช้ระบบ Academic Documents ในปัจจุบัน:**
- ✅ สามารถสร้าง content type "academic" ได้
- ✅ แสดงรายการเอกสารบนหน้า public ได้
- ✅ Marquee animation ทำงานได้ดี
- ⚠️ **แต่ยังไม่สามารถอัปโหลดไฟล์จริงได้** - ต้องแก้ไขตาม Phase 1 ก่อน

**ถ้าต้องการให้สมบูรณ์ 100%:**
- ต้องดำเนินการตาม Phase 1 และ Phase 2 ทั้งหมด
- ใช้เวลาประมาณ 2-3 ชั่วโมงในการพัฒนา
- ทดสอบการอัปโหลดและดาวน์โหลดไฟล์

---

**สถานะปัจจุบัน:** ✅ UI/UX สมบูรณ์ แต่ ⚠️ Backend ยังไม่รองรับไฟล์จริง
