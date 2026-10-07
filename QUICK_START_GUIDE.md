# 🚀 Quick Start Guide - Fixing Critical Issues
**เริ่มต้นแก้ไขปัญหาสำคัญทันที**

---

## 📋 สิ่งที่ต้องทำก่อนอ่าน

1. อ่าน [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md) - ภาพรวมสั้นๆ
2. ดูรายละเอียดใน [COMPREHENSIVE_AUDIT_REPORT.md](./COMPREHENSIVE_AUDIT_REPORT.md)
3. กลับมาที่นี่เพื่อเริ่มแก้ไข

---

## 🎯 Week 1: Critical Fixes (เริ่มเลย!)

### Day 1: Design Tokens Setup

**เป้าหมาย:** สร้างระบบ design tokens เบื้องต้น

#### Step 1.1: สร้างไฟล์ design-tokens.css

```bash
# สร้างไฟล์
touch styles/design-tokens.css
```

```css
/* styles/design-tokens.css */
:root {
  /* === SURFACE LEVELS - Stepped Tonal Ladder === */
  --surface-0: #05070C;   /* 3% lightness - deepest */
  --surface-1: #0A0D12;   /* 6% - card base */
  --surface-2: #0F131C;   /* 9% - hover */
  --surface-3: #161D2B;   /* 12% - active */
  --surface-4: #1E2636;   /* 15% - elevated */
  
  /* === TEXT COLORS === */
  --text-primary: #E5E5E5;
  --text-secondary: #D4D4D4;  /* Fixed: 7.1:1 contrast */
  --text-tertiary: #A3A3A3;
  --text-muted: #737373;
  
  /* === ACCENT COLORS - Cool Blue System === */
  --accent-primary: #38BDF8;
  --accent-primary-hover: #0EA5E9;
  --accent-secondary: #0E778F;
  --accent-warm: #D0AB86;
  
  /* === SEMANTIC COLORS === */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  
  /* === BORDERS === */
  --border-subtle: rgba(229, 229, 229, 0.1);
  --border-default: rgba(229, 229, 229, 0.2);
  --border-strong: rgba(229, 229, 229, 0.3);
  
  /* === TYPOGRAPHY SCALE - Fluid === */
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.3rem + 1vw, 2rem);
  --text-3xl: clamp(1.875rem, 1.5rem + 1.5vw, 2.5rem);
  --text-4xl: clamp(2.25rem, 1.8rem + 2vw, 3rem);
  --text-5xl: clamp(3rem, 2.25rem + 3vw, 4rem);
  
  /* === LINE HEIGHTS === */
  --leading-tight: 1.2;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 1.75;
  
  /* === SPACING SCALE === */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
  
  /* === SECTION SPACING - Fluid === */
  --section-gap: clamp(4rem, 8vw, 8rem);
  --section-gap-sm: clamp(2rem, 4vw, 4rem);
  
  /* === BORDER RADIUS === */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-full: 999px;
  
  /* === SHADOWS === */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
}
```

#### Step 1.2: Import ใน globals.css

```css
/* app/globals.css - เพิ่มบรรทัดนี้ด้านบน */
@import './design-tokens.css';
```

#### Step 1.3: ทดสอบ

```tsx
// ทดสอบใน component ใดก็ได้
<div style={{
  backgroundColor: 'var(--surface-1)',
  color: 'var(--text-primary)',
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-default)'
}}>
  ทดสอบ Design Tokens
</div>
```

---

### Day 2-3: Accessibility Fixes

**เป้าหมาย:** แก้ปัญหา accessibility สำคัญ

#### Step 2.1: Fix Color Contrast

```tsx
// Before
<p className="text-gray-400">Secondary text</p>  // 4.2:1 contrast

// After
<p style={{color: 'var(--text-secondary)'}}>Secondary text</p>  // 7.1:1 contrast
```

#### Step 2.2: Add ARIA Labels to Buttons

```tsx
// Before
<button onClick={handleDelete}>
  <Trash2 className="w-4 h-4" />
</button>

// After
<button 
  onClick={handleDelete}
  aria-label="Delete item"
  title="Delete"
>
  <Trash2 className="w-4 h-4" aria-hidden="true" />
</button>
```

#### Step 2.3: Add Skip to Content Link

```tsx
// app/layout.tsx - เพิ่มก่อน <body>
<a 
  href="#main-content"
  className="skip-link"
  style={{
    position: 'absolute',
    top: '-40px',
    left: 0,
    background: 'var(--accent-primary)',
    color: 'white',
    padding: 'var(--space-3) var(--space-6)',
    zIndex: 100,
    ':focus': { top: 0 }
  }}
>
  Skip to main content
</a>

// Add CSS in globals.css
.skip-link:focus {
  top: 0;
}
```

#### Step 2.4: Add Main Landmark

```tsx
// app/layout.tsx
<body>
  <header>
    <SiteNav />
  </header>
  
  <main id="main-content">
    {children}
  </main>
  
  <footer>
    <Footer />
  </footer>
</body>
```

#### Step 2.5: Fix Form Labels

```tsx
// Before
<input type="email" placeholder="Email" />

// After
<div>
  <label htmlFor="email">Email</label>
  <input 
    id="email"
    type="email"
    autoComplete="email"
    aria-required="true"
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? "email-error" : undefined}
  />
  {errors.email && (
    <span id="email-error" role="alert" style={{color: 'var(--color-error)'}}>
      {errors.email}
    </span>
  )}
</div>
```

---

### Day 4: Error Boundaries

**เป้าหมาย:** ป้องกัน white screen crashes

#### Step 3.1: สร้าง ErrorBoundary Component

```bash
mkdir -p components/shared
touch components/shared/ErrorBoundary.tsx
```

```tsx
// components/shared/ErrorBoundary.tsx
'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // TODO: Log to Sentry
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: 'var(--space-8)',
          backgroundColor: 'var(--surface-1)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)'
        }}>
          <AlertTriangle size={48} style={{color: 'var(--color-error)', marginBottom: 'var(--space-4)'}} />
          <h2 style={{fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)'}}>
            Something went wrong
          </h2>
          <p style={{color: 'var(--text-secondary)', marginBottom: 'var(--space-6)'}}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: 'var(--space-3) var(--space-6)',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### Step 3.2: Wrap Major Sections

```tsx
// app/layout.tsx
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <header>
            <SiteNav />
          </header>
          
          <main id="main-content">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          
          <footer>
            <Footer />
          </footer>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

---

### Day 5: Security Basics

**เป้าหมาย:** ป้องกัน common attacks

#### Step 4.1: Add Rate Limiting

```bash
npm install express-rate-limit
```

```typescript
// lib/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts
  message: 'Too many login attempts, please try again later.'
});
```

```typescript
// app/api/members/login/route.ts
import { authLimiter } from '@/lib/rate-limit';

export async function POST(request: Request) {
  // Apply rate limiting
  const rateLimitResult = await authLimiter(request);
  if (rateLimitResult) return rateLimitResult;
  
  // Rest of login logic...
}
```

#### Step 4.2: Sanitize User Input

```bash
npm install dompurify isomorphic-dompurify
npm install -D @types/dompurify
```

```typescript
// lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'title', 'target']
  });
}

// Usage in ContentEditorModal
const cleanContent = sanitizeHTML(formData.content);
```

#### Step 4.3: Add CSRF Protection

```bash
npm install next-csrf
```

```typescript
// lib/csrf.ts
import { csrf } from 'next-csrf';

export const { csrfProtection, generateToken } = csrf({
  secret: process.env.CSRF_SECRET!
});
```

```typescript
// app/api/content/route.ts
import { csrfProtection } from '@/lib/csrf';

export async function POST(request: Request) {
  await csrfProtection(request);
  // Rest of handler...
}
```

---

## 📝 Daily Checklist

### Day 1: Design Tokens ✅
- [ ] สร้าง `styles/design-tokens.css`
- [ ] Import ใน `globals.css`
- [ ] ทดสอบใน 1-2 components
- [ ] Commit: "feat: add design tokens system"

### Day 2-3: Accessibility ✅
- [ ] Fix color contrast (text-secondary)
- [ ] Add ARIA labels to icon buttons
- [ ] Add skip-to-content link
- [ ] Add main landmark
- [ ] Fix form labels and errors
- [ ] Test with keyboard navigation
- [ ] Commit: "fix: accessibility improvements"

### Day 4: Error Boundaries ✅
- [ ] สร้าง ErrorBoundary component
- [ ] Wrap layout
- [ ] Wrap main content
- [ ] Test error handling
- [ ] Commit: "feat: add error boundaries"

### Day 5: Security ✅
- [ ] Add rate limiting
- [ ] Sanitize user input
- [ ] Add CSRF protection
- [ ] Test login rate limit
- [ ] Commit: "security: add rate limiting and input sanitization"

---

## 🧪 Testing Checklist

### Accessibility Testing
```bash
# Manual tests
- [ ] Tab through entire site
- [ ] Use keyboard only (no mouse)
- [ ] Test with screen reader (NVDA/VoiceOver)
- [ ] Check color contrast with tool
- [ ] Verify focus indicators visible

# Automated
npm install --save-dev @axe-core/react
# Add to app/layout.tsx (dev only)
```

### Security Testing
```bash
# Test rate limiting
curl -X POST http://localhost:3000/api/members/login \
  -d '{"email":"test@test.com","password":"wrong"}' \
  -H "Content-Type: application/json"
# Run 6 times - should be blocked on 6th

# Test CSRF
# Try POST without CSRF token - should fail
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Design tokens not working
**Solution:** Make sure globals.css imports design-tokens.css and is imported in layout.tsx

### Issue 2: ErrorBoundary not catching errors
**Solution:** Must be 'use client' component, errors in server components need different handling

### Issue 3: Rate limiting not working in development
**Solution:** Rate limiting works per IP - use different browsers or incognito

### Issue 4: CSRF tokens failing
**Solution:** Check CSRF_SECRET in .env and ensure middleware runs before handlers

---

## 📚 Resources

### Must Read
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)

### Tools
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

## 🎯 Success Criteria

### Week 1 Complete When:
- ✅ Design tokens in use (at least homepage)
- ✅ Color contrast passes WCAG AA
- ✅ All icon buttons have ARIA labels
- ✅ Skip link works
- ✅ Error boundaries catch crashes
- ✅ Rate limiting on login
- ✅ User input sanitized
- ✅ Build passes without errors
- ✅ Manual accessibility test passes

### Next Week Preview
- Week 2: Enhanced design system, SEO
- Week 3: Testing setup, UX polish
- Week 4: Deploy & monitor

---

## ❓ Need Help?

### Quick Commands
```bash
# Run dev server
npm run dev

# Check build
npm run build

# Lint check
npm run lint

# Type check
npx tsc --noEmit
```

### Get More Info
- Full audit: [COMPREHENSIVE_AUDIT_REPORT.md](./COMPREHENSIVE_AUDIT_REPORT.md)
- Summary: [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)
- Performance: [PERFORMANCE_OPTIMIZATION_COMPLETE.md](./PERFORMANCE_OPTIMIZATION_COMPLETE.md)

---

**เริ่มเลย!** แก้ Day 1 วันนี้ แล้วค่อยๆ ไปต่อ ใน 5 วันระบบจะปลอดภัยและพร้อมใช้งานมากขึ้น 🚀

**Created:** 7 Oct 2026 | **By:** Claude Code
