# Phase 3: Performance & Optimization

**Goal:** Optimize bundle size, improve load times, and enhance runtime performance

**Target Metrics:**
- Admin bundle: 192 kB → <150 kB (-22%)
- First Load JS: 349 kB → <280 kB (-20%)
- Lighthouse Performance: 70 → 90+ (+20 points)
- Time to Interactive: <3s on 3G

---

## Priority Matrix

### 🔴 Critical (P0) - Do First
1. **Code Splitting** - Split TipTap editor (50 kB saved)
2. **Dynamic Imports** - Lazy load modals and heavy components
3. **Image Optimization** - Compress and lazy-load images
4. **Bundle Analysis** - Identify duplicate dependencies

### 🟡 High Priority (P1) - Do Next
5. **Memoization** - React.memo on expensive components
6. **Virtual Scrolling** - Handle large tables (1000+ rows)
7. **Database Query Optimization** - Add indexes and pagination
8. **API Route Optimization** - Implement caching headers

### 🟢 Medium Priority (P2) - Nice to Have
9. **Service Worker** - Offline support for admin
10. **Prefetching** - Preload admin routes on hover
11. **CSS Optimization** - Remove unused styles
12. **Font Optimization** - Preload critical fonts

---

## Phase 3 Implementation Plan

### Step 1: Bundle Analysis (15 min)
- Run `npm run build -- --analyze`
- Identify heavy dependencies
- Check for duplicate packages
- Find unused code

### Step 2: Code Splitting (30 min)
```tsx
// Dynamic imports for heavy components
const TipTapEditor = dynamic(() => import('@/components/admin/TipTapEditor'), {
  loading: () => <EditorSkeleton />,
  ssr: false
});

const BulkProgressModal = dynamic(() => import('@/components/admin/modals/BulkProgressModal'), {
  loading: () => null
});

const ContentAdvancedFilters = dynamic(() => import('@/components/admin/ContentAdvancedFilters'));
```

**Expected Impact:** -60 kB from /admin route

### Step 3: React.memo & useMemo (20 min)
- Wrap expensive list items
- Memoize filter calculations
- Prevent unnecessary re-renders

**Expected Impact:** 40% faster re-renders

### Step 4: Image Optimization (20 min)
- Use Next.js Image component
- Add loading="lazy"
- Compress existing images
- Generate WebP variants

**Expected Impact:** -200 kB initial load

### Step 5: Virtual Scrolling (45 min)
- Install react-window or @tanstack/react-virtual
- Implement for AdminMembersView table
- Implement for AdminContentView grid
- Handle 1000+ rows efficiently

**Expected Impact:** Render 50x faster for large datasets

### Step 6: Database Optimization (30 min)
- Add indexes on frequently queried columns
- Implement cursor-based pagination
- Add count queries with caching
- Optimize JOIN queries

**Expected Impact:** API response 3-5x faster

### Step 7: API Caching (20 min)
```ts
export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
    }
  });
}
```

**Expected Impact:** 80% reduction in database load

---

## Measurement Plan

### Before Metrics
```bash
npm run build
# Record:
# - /admin route size
# - First Load JS
# - Number of chunks
# - Build time
```

### After Metrics
```bash
npm run build
# Compare:
# - Bundle size reduction
# - Chunk count
# - Build time improvement
```

### Lighthouse Audit
```bash
npx lighthouse http://localhost:3000/admin --view
# Before/After comparison:
# - Performance score
# - First Contentful Paint
# - Time to Interactive
# - Total Blocking Time
```

---

## Success Criteria

✅ Admin bundle < 150 kB (-22%)
✅ First Load JS < 280 kB (-20%)
✅ Lighthouse Performance > 90
✅ Time to Interactive < 3s
✅ Virtual scrolling for 1000+ rows
✅ All builds passing
✅ Zero performance regressions

---

## Risk Mitigation

1. **Dynamic imports may break SSR**
   - Mitigation: Use `ssr: false` for client-only components
   
2. **Virtual scrolling complexity**
   - Mitigation: Use battle-tested library (@tanstack/react-virtual)
   
3. **Cache invalidation issues**
   - Mitigation: Use short TTLs (60s) + stale-while-revalidate

4. **Image optimization may break layouts**
   - Mitigation: Test each image replacement thoroughly

---

## Timeline

- **Step 1-2:** Bundle analysis + Code splitting → 45 min
- **Step 3-4:** Memoization + Images → 40 min  
- **Step 5:** Virtual scrolling → 45 min
- **Step 6-7:** Database + API caching → 50 min
- **Testing:** Lighthouse audit + verification → 20 min

**Total Estimated Time:** ~3 hours

---

## Tools & Packages Needed

```bash
# Bundle analysis
npm install --save-dev @next/bundle-analyzer

# Virtual scrolling
npm install @tanstack/react-virtual

# Image optimization (built-in to Next.js)
# No additional packages needed
```

---

**Status:** 📋 Planning Complete - Ready to Execute
**Next:** Run bundle analyzer and start code splitting
