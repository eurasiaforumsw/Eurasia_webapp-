# ImageGallery Component

Modern, responsive image gallery with lightbox functionality for news and events pages.

## Features

- **Responsive Grid**: 3 columns (desktop), 2 columns (tablet), 1 column (mobile)
- **Lightbox Viewer**: Full-size image display with navigation
- **Keyboard Navigation**: Arrow keys for prev/next, Escape to close
- **Touch Support**: Swipe gestures on mobile devices
- **Lazy Loading**: Images load on demand for performance
- **Smooth Animations**: Hover effects and transitions
- **Accessibility**: ARIA labels, keyboard focus, screen reader support

## Usage

```tsx
import ImageGallery from '@/components/content/ImageGallery';

const images = [
  {
    id: '1',
    url: '/images/news/cover-1.jpg',
    alt: 'Summit 2026 keynote speaker',
    width: 1920,
    height: 1080,
  },
  {
    id: '2',
    url: '/images/news/cover-2.jpg',
    alt: 'Workshop participants',
    width: 1920,
    height: 1080,
  },
];

<ImageGallery images={images} />
```

## Props

- `images`: Array of gallery images (required)
  - `id`: Unique identifier
  - `url`: Image URL
  - `alt`: Alt text for accessibility (optional)
  - `width`: Image width in pixels (optional, default 1920)
  - `height`: Image height in pixels (optional, default 1080)
- `className`: Additional CSS classes (optional)

## Integration with Admin

The gallery displays images uploaded through the admin content editor:
- Cover images (with crop support)
- Additional activity/news images
- Automatically arranged in responsive grid

## Styling

The component uses scoped styles with CSS custom properties:
- `--gap`: Grid gap (responsive)
- `--radius`: Border radius (responsive)
- Consistent with design system (surface colors, accent #38BDF8)
