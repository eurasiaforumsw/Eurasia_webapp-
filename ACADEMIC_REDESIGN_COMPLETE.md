# Academic Documents Page - Complete Redesign

## 🎨 Design Overview

This redesign transforms the academic documents page into a modern, immersive experience inspired by editorial and portfolio sites like CuriosityStream, Centre Pompidou, and Astro Docs.

## ✨ Key Features

### 1. **Featured Showcase Hero**
- Full-viewport hero section with rotating featured documents
- Auto-playing carousel (6s intervals) with manual controls
- Large typography with gradient overlays
- Author profiles with circular avatars
- View/download statistics
- Smooth slide transitions with navigation dots

### 2. **Author Profile Marquee**
- Infinite horizontal scroll of researcher profiles
- Circular profile images with gradient rings
- Pause on hover for interaction
- Click to filter documents by author
- Displays document count and view statistics
- Configurable sort modes (latest, popular, prolific)

### 3. **Sticky Document Filters**
- Dynamic sticky behavior with glassmorphism effect
- Search, category, tags, sort, and view mode controls
- Expandable tag filter panel
- Real-time results counter
- Smooth transitions and active states

### 4. **Enhanced Document Cards**
- Dark theme with surface layering (5-7 levels)
- Hover effects with elevation and glow
- Category badges, author info, tags
- View/download statistics
- Quick action buttons

### 5. **Call-to-Action Section**
- Gradient background with radial overlays
- Prominent submit button
- Centered layout with responsive typography

## 📁 File Structure

```
/app/academic-documents/
├── page-redesigned.tsx          # New redesigned page component
├── redesign.css                 # Complete design system styles
└── page.tsx                     # Original page (preserved)

/components/academic/
├── FeaturedShowcase.tsx         # Hero carousel component
├── AuthorProfileMarquee.tsx     # Scrolling author profiles
├── StickyDocumentFilters.tsx    # Enhanced filter bar (existing)
├── AuthorMarquee.tsx            # Original marquee (preserved)
└── StickyDocumentFilters.tsx    # Original filters (preserved)
```

## 🎨 Design System

### Color Palette
- **Surface Levels**: 7-step dark progression (#05070C → #2A3448)
- **Primary Accent**: Cyan (#38BDF8)
- **Secondary Accent**: Emerald (#6EE7B7)
- **Text**: White → Muted (#F8FAFC → #94A3B8)

### Typography
- **Display**: `clamp(1.75rem, 4vw, 3.5rem)` with -0.02em tracking
- **Body**: `clamp(1rem, 1.8vw, 1.25rem)` with 1.7 line-height
- **Labels**: Uppercase, 0.1em tracking, 700 weight

### Spacing Scale
- XS: 0.5rem
- SM: 0.75rem
- MD: 1rem
- LG: 1.5rem
- XL: 2rem
- 2XL: 3rem
- 3XL: 4rem

### Border Radius
- SM: 0.5rem
- MD: 0.75rem
- LG: 1rem
- XL: 1.5rem
- FULL: 9999px

## 🚀 Features & Interactions

### Featured Showcase
- **Auto-play**: 6 seconds per slide
- **Manual Control**: Previous/Next arrows
- **Pagination**: Dot indicators with active state
- **Click Action**: Navigate to document detail
- **Hover Effects**: Pause auto-play

### Author Marquee
- **Animation**: 60s linear infinite scroll
- **Hover**: Pause scroll, elevate card
- **Click**: Filter documents by author name
- **Gradient Ring**: Conic gradient animation on hover
- **Sort Modes**: Latest, Popular (views), Prolific (document count)

### Sticky Filters
- **Sticky Trigger**: After 400px scroll
- **Glassmorphism**: Blur backdrop when sticky
- **Search**: Real-time filtering with clear button
- **Category**: Dropdown with document counts
- **Tags**: Expandable panel with active states
- **Sort**: Newest, Oldest, Popular, A-Z
- **View Mode**: Grid/List toggle
- **Results Counter**: Live document count

### Document Cards
- **Hover**: -4px translateY, border glow, shadow
- **Click**: Navigate to detail page
- **Animations**: Cubic-bezier easing (0.4, 0, 0.2, 1)
- **Line Clamp**: Title (2 lines), Summary (3 lines)

## 📱 Responsive Behavior

### Desktop (>1024px)
- Featured: 2-column grid (content | visual)
- Marquee: Full cards visible
- Filters: 4-column grid
- Documents: Auto-fill grid (380px min)

### Tablet (768px - 1024px)
- Featured: Single column, centered
- Marquee: Smaller cards (200px)
- Filters: Single column stack
- Documents: 2-column responsive grid

### Mobile (<768px)
- Featured: Compact layout, smaller nav
- Marquee: Compact cards (180px), smaller avatars
- Filters: Mobile-optimized controls
- Documents: Single column grid

## 🔧 Integration Notes

### Data Sources
- **Documents**: `getPublishedAdminContent("academic")`
- **Engagement**: `getContentEngagement(docId)`
- **Sample Data**: 5 pre-populated documents for demo

### Dynamic Features
- Author profiles auto-generated from documents
- Featured documents filtered by `featured: true` flag
- Real-time statistics (views, downloads, likes)
- Sort and filter state management

### Performance
- `useMemo` for expensive computations
- Lazy loading for marquee images
- CSS animations with `will-change`
- Optimized grid layouts

## 🎯 Usage

### To Preview Redesign
1. Navigate to `/academic-documents`
2. The redesigned page loads with all new components
3. Interact with featured showcase, author marquee, and filters

### Configuration Options

**Featured Showcase:**
```tsx
<FeaturedShowcase
  documents={featuredDocuments}  // Top 5 featured docs
  onDocumentClick={handleClick}  // Navigation handler
/>
```

**Author Marquee:**
```tsx
<AuthorProfileMarquee
  authors={authorProfiles}       // Auto-generated from docs
  sortMode="popular"             // 'latest' | 'popular' | 'prolific'
  onAuthorClick={handleAuthorClick}
  label="Featured Researchers"
/>
```

**Sticky Filters:**
```tsx
<StickyDocumentFilters
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  selectedCategory={selectedCategory}
  onCategoryChange={setSelectedCategory}
  categories={categories}
  selectedTags={selectedTags}
  onTagsChange={setSelectedTags}
  allTags={allTags}
  sortBy={sortBy}
  onSortChange={setSortBy}
  sortOptions={SORT_OPTIONS}
  viewMode={viewMode}
  onViewModeChange={setViewMode}
  resultsCount={filteredDocuments.length}
/>
```

## 🎨 Customization

### Change Accent Colors
Edit CSS variables in `redesign.css`:
```css
:root {
  --accent-primary: #38bdf8;    /* Change to brand color */
  --accent-secondary: #6ee7b7;  /* Supporting color */
}
```

### Adjust Animation Timing
```css
.author-profile-marquee__track {
  animation: marqueeScroll 60s linear infinite; /* Change 60s */
}
```

### Modify Card Layout
```css
.academic-grid-redesigned {
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); /* Change min */
}
```

## ✅ Checklist

- ✅ Featured showcase with carousel
- ✅ Author profile marquee with circular avatars
- ✅ Sticky filters with glassmorphism
- ✅ Enhanced document cards
- ✅ Dark theme design system
- ✅ Responsive layouts (mobile/tablet/desktop)
- ✅ Smooth animations and transitions
- ✅ Real-time filtering and sorting
- ✅ Click-to-navigate interactions
- ✅ Author filtering from marquee

## 🚀 Next Steps

1. **Add Images**: Populate `authorImage` and `coverImage` fields
2. **API Integration**: Replace sample data with real backend
3. **Accessibility**: Add ARIA labels and keyboard navigation
4. **Analytics**: Track carousel interactions and filter usage
5. **Testing**: Cross-browser and device testing

---

**Built with**: React, Next.js, TypeScript, CSS Custom Properties
**Design Inspiration**: CuriosityStream, Centre Pompidou, Astro Docs
**Theme**: Dark editorial with cyan/emerald accents
