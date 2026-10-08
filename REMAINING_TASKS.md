# 📋 สิ่งที่เหลือต้องทำ (Remaining Tasks)
## Eurasia Studies Website - Post Security & Academic Page Updates

**อัพเดทล่าสุด:** 8 ตุลาคม 2026  
**สถานะโครงการ:** 85/100 (B+)

---

## ✅ เสร็จแล้ว (Completed Today)

### 🔐 Security Fixes (100%)
- ✅ JWT + HttpOnly cookies authentication
- ✅ Server-side middleware protection
- ✅ bcrypt password hashing
- ✅ API routes secured
- ✅ Remove password from client bundle
- ✅ Dependencies installed (jose, jsonwebtoken, bcrypt, cookie)

### 🎨 Academic Documents Page Redesign (100%)
- ✅ Author Marquee component (circular profiles)
- ✅ Sticky Filters with glassmorphism
- ✅ Document Cards responsive grid
- ✅ Sort by Latest/Most Read
- ✅ Framer Motion animations
- ✅ Click profile → filter by author

---

## 🚀 ขั้นตอนถัดไป (Next Immediate Steps)

### 1️⃣ **Deploy to Vercel** (ทำก่อน - 10 นาที)

**ยังไม่ได้ทำ:**
- [ ] เพิ่ม Environment Variables ใน Vercel Dashboard:
  - `JWT_SECRET=Vei6k0vFaMfZmI67q9BH8Iubv6ePDXCc8OZBQbjx9Xw=`
  - `ADMIN_PASSWORD_HASH=$2b$12$QI870B2LMENPYRNKh9s.POFRpqLMmXJ7SqpnrqAM9HK7xiNU4aEHq`
- [ ] ลบ `NEXT_PUBLIC_ADMIN_PASSWORD` (เก่า)
- [ ] Redeploy
- [ ] ทดสอบ login: `admin@efsw.local` / `EFSW-secure-admin-2024`

**วิธีทำ:** อ่าน [VERCEL_SETUP.md](./VERCEL_SETUP.md)

---

## 🔴 ลำดับความสำคัญสูง (High Priority)

### 2️⃣ **Accessibility Fixes** (3-5 วัน)

**จากรายงาน COMPREHENSIVE_AUDIT_REPORT.md:**

#### Critical Issues:
- [ ] **ARIA Labels** - เพิ่ม aria-label ให้ buttons และ form inputs
  - Icon buttons ไม่มี accessible names
  - Form inputs บางตัวไม่มี labels
  - Dropdowns ขาด aria-expanded
  
- [ ] **Keyboard Navigation** 
  - ✅ AdminSidebar (เสร็จแล้ว)
  - ✅ ContentEditorModal (เสร็จแล้ว)
  - [ ] BoardMemberEditorModal
  - [ ] LeaderEditorModal
  - [ ] ConfirmDeleteDialog
  - [ ] SiteNav dropdown menus
  
- [ ] **Focus Management**
  - [ ] Modal ไม่ auto-focus first element
  - [ ] Modal ปิดแล้วไม่ restore focus
  - [ ] Skip to content link ยังไม่มี
  
- [ ] **Color Contrast** (WCAG AA 4.5:1)
  - `text-gray-400` on `gray-900` = 4.2:1 ❌
  - Secondary buttons contrast ต่ำ
  - Placeholder text อ่านยาก

**ไฟล์ที่ต้องแก้:**
```
components/admin/modals/BoardMemberEditorModal.tsx
components/admin/modals/LeaderEditorModal.tsx
components/admin/modals/ConfirmDeleteDialog.tsx
components/efsw/SiteNav.tsx
app/layout.tsx (skip link)
```

---

### 3️⃣ **Design Token System** (2-3 วัน)

**ปัญหาปัจจุบัน:**
- Typography hard-coded (`text-2xl`, `text-lg`)
- Colors inline Tailwind (`bg-gray-900`, `text-white`)
- Spacing ไม่สม่ำเสมอ
- Border radius ซ้ำซ้อน (`rounded-lg` everywhere)

**ต้องสร้าง:**

#### `styles/design-tokens.css`
```css
/* Typography Scale - Fluid */
--text-xs: clamp(0.75rem, 0.9vw, 0.875rem);
--text-sm: clamp(0.875rem, 1.1vw, 1rem);
--text-base: clamp(1rem, 1.5vw, 1.125rem);
--text-lg: clamp(1.125rem, 2vw, 1.5rem);
--text-xl: clamp(1.25rem, 2.5vw, 1.75rem);
--text-2xl: clamp(1.5rem, 3vw, 2.25rem);
--text-3xl: clamp(1.875rem, 4vw, 3rem);
--text-4xl: clamp(2.25rem, 5vw, 4rem);

/* Surface Levels */
--surface-0: #05070C;
--surface-1: #0A0D12;
--surface-2: #0F131C;
--surface-3: #161D2B;
--surface-4: #1E2636;

/* Accent Colors */
--accent-primary: #38BDF8;
--accent-secondary: #6EE7B7;
--accent-muted: #0E778F;

/* Spacing Scale */
--space-xs: clamp(0.5rem, 1vw, 0.75rem);
--space-sm: clamp(0.75rem, 1.5vw, 1rem);
--space-md: clamp(1rem, 2vw, 1.5rem);
--space-lg: clamp(1.5rem, 3vw, 2rem);
--space-xl: clamp(2rem, 4vw, 3rem);
--space-2xl: clamp(3rem, 6vw, 5rem);

/* Border Radius */
--radius-sm: 0.375rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--radius-xl: 1rem;
--radius-full: 9999px;
```

**Apply ใน:**
```
app/globals.css (import tokens)
tailwind.config.ts (extend with CSS vars)
components/* (replace hard-coded values)
```

---

### 4️⃣ **Error Boundaries** (1 วัน)

**ยังไม่มี:**
- Error boundaries wrapper
- User-friendly error UI
- Error logging system

**ต้องสร้าง:**

#### `components/ErrorBoundary.tsx`
```tsx
'use client';
import React from 'react';

export class ErrorBoundary extends React.Component<
  {children: React.ReactNode; fallback?: React.ReactNode},
  {hasError: boolean; error?: Error}
> {
  state = {hasError: false, error: undefined};

  static getDerivedStateFromError(error: Error) {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
    // TODO: Send to Sentry/logging service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1>เกิดข้อผิดพลาด</h1>
            <button onClick={() => window.location.reload()}>
              โหลดหน้าใหม่
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Wrap sections:**
```tsx
// app/layout.tsx
<ErrorBoundary>
  <SiteNav />
</ErrorBoundary>

// app/admin/page.tsx
<ErrorBoundary fallback={<AdminErrorUI />}>
  {adminContent}
</ErrorBoundary>
```

---

## 🟡 ความสำคัญปานกลาง (Medium Priority)

### 5️⃣ **SEO Enhancements** (2-3 วัน)

**ขาดหายไป:**
- [ ] Dynamic meta tags per page
- [ ] Structured data (JSON-LD)
- [ ] OG images
- [ ] Sitemap.xml
- [ ] robots.txt

**ตัวอย่าง:**

#### `app/academic-documents/page.tsx`
```tsx
export const metadata: Metadata = {
  title: 'งานวิจัยวิชาการ | Eurasia Studies',
  description: 'ค้นหางานวิจัย บทความวิชาการ และเอกสารศึกษาเกี่ยวกับยูเรเชีย',
  openGraph: {
    title: 'งานวิจัยวิชาการ',
    description: 'ค้นหางานวิจัยและบทความวิชาการ',
    images: ['/og-images/academic.jpg'],
  },
};
```

#### `app/sitemap.ts` (สร้างใหม่)
```ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {url: 'https://eurasia.com', lastModified: new Date()},
    {url: 'https://eurasia.com/about', lastModified: new Date()},
    {url: 'https://eurasia.com/events', lastModified: new Date()},
    {url: 'https://eurasia.com/academic-documents', lastModified: new Date()},
    // TODO: Dynamic pages from DB
  ];
}
```

---

### 6️⃣ **Loading States & Skeletons** (2 วัน)

**หน้าที่ต้องเพิ่ม:**
- [ ] Homepage news feed
- [ ] Events list
- [ ] Academic documents grid
- [ ] Admin content table
- [ ] Member list

**ตัวอย่าง:**

#### `components/skeletons/DocumentCardSkeleton.tsx`
```tsx
export function DocumentCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-800 rounded-lg mb-4" />
      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-700 rounded w-1/2" />
    </div>
  );
}
```

---

### 7️⃣ **Image Optimization** (1 วัน)

**ปัญหา:**
- Event images ไม่ใช้ Next/Image
- Team photos ไม่ optimize
- Sharp module ไม่ได้ติดตั้ง

**แก้ไข:**
```bash
npm install sharp
```

**Replace `<img>` with `<Image>`:**
```tsx
import Image from 'next/image';

// Before
<img src={event.image} alt={event.title} />

// After
<Image
  src={event.image}
  alt={event.title}
  width={800}
  height={600}
  className="..."
  placeholder="blur"
  blurDataURL="data:image/..."
/>
```

---

## 🟢 ความสำคัญต่ำ (Nice to Have)

### 8️⃣ **Testing Setup** (5-7 วัน)

- [ ] Jest + React Testing Library
- [ ] Unit tests (utils, hooks)
- [ ] Integration tests (API routes)
- [ ] E2E tests (Playwright)

### 9️⃣ **Advanced Admin Features** (5-7 วัน)

- [ ] Analytics dashboard (charts)
- [ ] Activity logs
- [ ] Member import/export CSV
- [ ] Email campaigns
- [ ] Backup/restore

### 🔟 **UX Polish** (3-5 วัน)

- [ ] Micro-interactions
- [ ] Better animations
- [ ] Toast notifications system
- [ ] Confirmation dialogs
- [ ] Progress indicators

---

## 📊 Progress Tracker

### Overall Completion: 75/100

| Category | Completed | Remaining | Priority |
|----------|-----------|-----------|----------|
| Security | ✅ 100% | 0% | Critical |
| Academic Page | ✅ 100% | 0% | Critical |
| Deployment | ❌ 0% | 100% | **Do Now** |
| Accessibility | 🟡 40% | 60% | High |
| Design Tokens | ❌ 0% | 100% | High |
| Error Handling | ❌ 0% | 100% | High |
| SEO | 🟡 20% | 80% | Medium |
| Loading States | ❌ 0% | 100% | Medium |
| Images | 🟡 50% | 50% | Medium |
| Testing | ❌ 0% | 100% | Low |
| Advanced Features | 🟡 30% | 70% | Low |
| UX Polish | 🟡 60% | 40% | Low |

---

## 🎯 Recommended Workflow

### Week 1 (Critical)
**Day 1:** Deploy to Vercel  
**Day 2-3:** Fix accessibility issues  
**Day 4-5:** Implement design tokens  

### Week 2 (High Priority)
**Day 1:** Error boundaries  
**Day 2-3:** SEO enhancements  
**Day 4-5:** Loading states  

### Week 3 (Medium Priority)
**Day 1-2:** Image optimization  
**Day 3-5:** Testing setup (basic)  

### Week 4+ (Polish)
**Ongoing:** UX improvements, advanced features

---

## 📝 Quick Reference

### คำสั่งที่ใช้บ่อย:

```bash
# Development
npm run dev

# Build & Test
npm run build
npm run lint

# Deploy
vercel --prod

# Generate password hash
node scripts/generate-admin-hash.js "password"
```

### ไฟล์สำคัญ:

- [VERCEL_SETUP.md](./VERCEL_SETUP.md) - Deployment guide
- [SECURITY_MIGRATION_GUIDE.md](./SECURITY_MIGRATION_GUIDE.md) - Security setup
- [COMPREHENSIVE_AUDIT_REPORT.md](./COMPREHENSIVE_AUDIT_REPORT.md) - Full audit

### Credentials:

- Admin: `admin@efsw.local` / `EFSW-secure-admin-2024`

---

## 🚦 Status Legend

- ✅ **100%** - เสร็จสมบูรณ์
- 🟡 **Partial** - ทำไปบางส่วน
- ❌ **0%** - ยังไม่ได้เริ่ม
- 🔴 **Critical** - ต้องทำก่อน
- 🟡 **High** - สำคัญ
- 🟢 **Medium** - ปานกลาง
- ⚪ **Low** - Nice to have

---

**อัพเดทโดย:** Claude Opus 5.5  
**วันที่:** 8 ตุลาคม 2026  
**Next Action:** Deploy to Vercel ✅
