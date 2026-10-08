# Academic Documents Page Redesign Specification

## Overview
Complete redesign of the academic documents page with modern editorial layout, marquee profile slider, and sticky navigation.

## Design Direction
- **Macrostructure**: Marquee Hero with editorial layout
- **Mode**: Dark theme with warm accent
- **Palette**: Deep surfaces (#05070C → #1E2636) with teal accent (#38BDF8)
- **Typography**: Grotesk sans-serif, fluid scale with clamp()
- **Layout**: CSS Grid-first, sticky scroll sections

## Key Features

### 1. Hero Section
- Full viewport height marquee hero
- Centered headline with editorial spacing
- Stats row (documents count, categories, topics)
- Smooth scroll anchor

### 2. Author Marquee Slider
- **Circular profile avatars** (96px diameter)
- Infinite horizontal scroll with fade edges
- Configurable sort modes:
  - `latest`: Sort by most recent document publication
  - `popular`: Sort by total view count
- Badge showing document count per author
- Click avatar → navigate to author's document collection
- Pause on hover, respects reduced-motion
- Profile images sourced from member profiles

### 3. Featured Documents Section
- Sticky scroll layout with featured papers
- Large card format with:
  - Author avatar (left)
  - Document metadata (right)
  - Category badge
  - View/download/like stats
  - Preview excerpt

### 4. Document Grid
- Responsive grid (1-3 columns)
- Card hover effects: lift + border glow
- Filtering by category, tags, search
- Sort options: newest, oldest, popular, title A-Z
- Grid/List view toggle

### 5. Components to Create

#### `/components/efsw/DocumentCard.tsx`
- Horizontal card layout
- Props: id, title, author, authorAvatar, category, summary, views, date, onClick
- Hover: scale + glow effect
- Click: navigate to document detail

#### `/components/efsw/DocumentHero.tsx`
- Full-height hero section
- Fluid typography with clamp()
- Stats grid
- Smooth scroll indicator

#### `/components/efsw/StickyDocumentLayout.tsx`
- Sticky scroll container
- Featured document sections
- Dynamic content loading

#### Update `/components/efsw/AuthorMarquee.tsx`
- Already exists, enhance with configurable settings
- Add sort mode prop
- Integrate with member profile data

## Data Flow

### Author Data
```typescript
interface Author {
  id: string;
  name: string;
  avatar: string; // from MemberProfile
  docCount: number;
  totalViews: number;
  latestDate: string;
}
```

### Document Data
```typescript
interface Document {
  id: string;
  title: string;
  category: "Research" | "Practice" | "Briefings";
  author: string;
  authorId: string;
  authorAvatar: string;
  date: string;
  summary: string;
  tags: string[];
  views: number;
  downloads: number;
  likes: number;
}
```

## Implementation Steps

1. ✅ Review existing structure
2. Create DocumentCard component
3. Create DocumentHero component
4. Create StickyDocumentLayout component
5. Update page.tsx with new layout
6. Add author data aggregation logic
7. Integrate AuthorMarquee with member profiles
8. Add CSS animations and transitions
9. Test responsive behavior
10. Verify accessibility (keyboard nav, ARIA labels)

## Design Tokens
```css
:root {
  --surface-1: #05070C;
  --surface-2: #0A0D12;
  --surface-3: #0F131C;
  --surface-4: #161D2B;
  --surface-5: #1E2636;
  --accent-teal: #38BDF8;
  --accent-muted: #6EE7B7;
  --text-primary: #FFFFFF;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.5);
  --border-radius-lg: 16px;
  --border-radius-full: 999px;
  --spacing-section: clamp(80px, 10vw, 140px);
}
```

## Accessibility Requirements
- Keyboard navigation for all interactive elements
- ARIA labels on marquee slider
- Focus indicators matching brand
- Reduced-motion support for animations
- Color contrast ratio ≥ 4.5:1 for text
- Alt text for all profile images

