# Animation System Documentation

## Overview

The Academic Document page animation system provides a comprehensive set of utilities, variants, and CSS classes for creating smooth, accessible animations throughout the application.

## File Structure

```
lib/
├── animation-variants.ts    # Framer Motion variants
├── animation-utils.ts        # Documentation & exports
└── responsive-utils.ts       # Responsive utilities

app/
└── globals.css              # CSS animations & keyframes

components/efsw/
├── AuthorMarquee.tsx         # Infinite scroll marquee
├── AuthorMarqueeSkeleton.tsx # Loading state
├── DocumentCard.tsx          # Interactive card
├── DocumentCardSkeleton.tsx  # Loading state
└── StickyDocumentLayout.tsx  # Sticky scroll sections
```

## Framer Motion Variants

### Core Animations

#### `fadeInUp`
Fade in with upward motion
- Initial: opacity 0, translateY 32px
- Animate: opacity 1, translateY 0
- Duration: 600ms
- Easing: Expo out

```tsx
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animation-variants';

<motion.div variants={fadeInUp} initial="initial" animate="animate">
  Content
</motion.div>
```

#### `staggerChildren`
Container for staggered child animations
- Stagger delay: 120ms
- Initial delay: 100ms

```tsx
<motion.div variants={staggerChildren} initial="initial" animate="animate">
  {items.map(item => (
    <motion.div key={item.id} variants={gridItem}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

#### `scaleOnHover`
Scale animation for hover interactions
- Hover: scale 1.05 with spring easing
- Tap: scale 0.97

```tsx
<motion.button variants={scaleOnHover} whileHover="hover" whileTap="tap">
  Click me
</motion.button>
```

#### `slideInFromLeft` / `slideInFromRight`
Horizontal slide animations
- Initial: opacity 0, translateX ±48px
- Duration: 500ms

#### `cardHoverLift`
Lift card with shadow on hover
- Hover: translateY -8px with glow shadow

### Loading States

#### `shimmer`
Background position animation for shimmer effect
- Duration: 2s linear infinite

#### `pulseGlow`
Pulsing opacity and scale
- Duration: 2s infinite

## CSS Animation Classes

### Marquee

**Class:** `academic-marquee-animate`
- Desktop: 40s duration
- Mobile: 30s duration
- Pauses on hover/focus
- Respects prefers-reduced-motion

```tsx
<div className="academic-marquee-animate">
  {/* Content */}
</div>
```

### Loading States

**Class:** `academic-shimmer`
```tsx
<div className="academic-shimmer w-full h-4 rounded" />
```

**Class:** `academic-skeleton`
```tsx
<div className="academic-skeleton w-24 h-24 rounded-full" />
```

### Entrance Animations

**Class:** `academic-fade-in-up`
```tsx
<div className="academic-fade-in-up">Content</div>
```

**Class:** `academic-stagger-item`
Use with `academic-fade-in-up` for staggered entrance
```tsx
<div>
  {items.map((item, i) => (
    <div key={i} className="academic-fade-in-up academic-stagger-item">
      {item}
    </div>
  ))}
</div>
```

### Effects

**Class:** `academic-pulse`
Pulsing scale animation

**Class:** `academic-glow-animate`
Pulsing glow effect

## Accessibility Features

### Focus Management

**Class:** `academic-focus-ring`
- Visible focus indicator
- 2px solid teal outline
- 3px offset
- Only shows on `:focus-visible`

```tsx
<button className="academic-focus-ring">Accessible button</button>
```

### Skip Links

**Class:** `academic-skip-link`
```tsx
<a href="#main-content" className="academic-skip-link">
  Skip to main content
</a>
```

### Screen Reader Text

**Class:** `academic-sr-only`
```tsx
<span className="academic-sr-only">
  Additional context for screen readers
</span>
```

### ARIA Labels

All interactive components include proper ARIA labels:

```tsx
// DocumentCard
<article
  role="article"
  aria-label={`${title} by ${author}`}
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') onClick();
  }}
>
  {/* Content */}
</article>

// AuthorMarquee
<button
  aria-label={`View ${author.name}'s research documents. ${docCount} documents`}
  tabIndex={index % authors.length === 0 ? 0 : -1}
>
  {/* Avatar */}
</button>
```

## Responsive Design

### Grid Layout

**Class:** `academic-grid-responsive`
- Mobile (< 640px): 1 column
- Tablet (640-1023px): 2 columns
- Desktop (≥ 1024px): 3 columns
- Fluid gap: clamp(1rem, 3vw, 1.5rem)

```tsx
<div className="academic-grid-responsive">
  {documents.map(doc => <DocumentCard key={doc.id} {...doc} />)}
</div>
```

### Responsive Utilities

```tsx
import {
  isMobileDevice,
  isTabletDevice,
  isDesktopDevice,
  getGridColumns,
  getMarqueeSpeed
} from '@/lib/responsive-utils';

// Check device type
if (isMobileDevice()) {
  // Mobile-specific logic
}

// Get marquee speed
const speed = getMarqueeSpeed(isMobile);
```

## Component Examples

### Author Marquee with Loading

```tsx
import AuthorMarquee from '@/components/efsw/AuthorMarquee';
import AuthorMarqueeSkeleton from '@/components/efsw/AuthorMarqueeSkeleton';

{loading ? (
  <AuthorMarqueeSkeleton />
) : (
  <AuthorMarquee
    authors={authors}
    sortMode="latest"
    onAuthorClick={(id) => router.push(`/authors/${id}`)}
  />
)}
```

### Document Grid with Skeletons

```tsx
import DocumentCard from '@/components/efsw/DocumentCard';
import DocumentCardSkeleton from '@/components/efsw/DocumentCardSkeleton';

<div className="academic-grid-responsive">
  {loading ? (
    Array.from({ length: 6 }).map((_, i) => (
      <DocumentCardSkeleton key={i} />
    ))
  ) : (
    documents.map(doc => (
      <DocumentCard
        key={doc.id}
        {...doc}
        onClick={() => handleDocClick(doc.id)}
      />
    ))
  )}
</div>
```

### Sticky Sections

```tsx
import StickyDocumentLayout from '@/components/efsw/StickyDocumentLayout';

const sections = [
  {
    id: 'latest',
    title: 'Latest Research',
    content: <DocumentGrid documents={latest} />
  },
  {
    id: 'popular',
    title: 'Most Popular',
    content: <DocumentGrid documents={popular} />
  }
];

<StickyDocumentLayout sections={sections} />
```

## Performance Optimization

### GPU Acceleration

Use `academic-gpu-accelerate` class for smooth animations:

```tsx
<div className="academic-gpu-accelerate transform transition-transform">
  {/* Animated content */}
</div>
```

### Reduced Motion

All animations respect `prefers-reduced-motion`:

```tsx
import { prefersReducedMotion } from '@/lib/responsive-utils';

if (!prefersReducedMotion()) {
  // Enable animations
}
```

### Smooth Scroll

```tsx
import { enableSmoothScroll, disableSmoothScroll } from '@/lib/responsive-utils';

// Enable on mount
useEffect(() => {
  enableSmoothScroll();
  return () => disableSmoothScroll();
}, []);
```

## Keyframe Reference

All keyframes are defined in `app/globals.css`:

- `academic-marquee-scroll` - Infinite horizontal scroll
- `academic-shimmer` - Loading shimmer effect
- `academic-fade-in-up` - Entrance animation
- `academic-pulse-scale` - Scale pulsing
- `academic-glow-pulse` - Glow pulsing

## Design Tokens

```css
--surface-1: #05070C
--surface-2: #0A0D12
--surface-3: #0F131C
--accent-teal: #38BDF8
```

## Browser Support

- Modern browsers with CSS Grid support
- Framer Motion requires React 18+
- Intersection Observer API for visibility detection
- CSS custom properties
- CSS animations with `@keyframes`

## Best Practices

1. **Always use loading skeletons** - Provide visual feedback during data fetching
2. **Respect user preferences** - Honor `prefers-reduced-motion`
3. **Keyboard navigation** - All interactive elements should be keyboard accessible
4. **Focus management** - Use `academic-focus-ring` on focusable elements
5. **Semantic HTML** - Use proper ARIA roles and labels
6. **Performance** - Use CSS animations for simple effects, Framer Motion for complex ones
7. **Stagger delays** - Keep stagger delays under 150ms for perceived speed
8. **Animation duration** - Keep most animations under 600ms

## Testing Checklist

- [ ] Animations work on mobile, tablet, desktop
- [ ] Marquee pauses on hover and focus
- [ ] Loading skeletons display correctly
- [ ] Reduced motion is respected
- [ ] Keyboard navigation works
- [ ] Focus indicators are visible
- [ ] Screen readers announce content correctly
- [ ] High contrast mode is supported
- [ ] Animations don't cause layout shift
- [ ] Performance is smooth (60fps)
