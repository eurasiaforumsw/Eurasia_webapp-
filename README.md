# EFSW Website

Award-winning interactive website for Eurasia Forum for Social Workers.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + CSS Custom Properties
- **Animation:** GSAP + ScrollTrigger, Framer Motion
- **3D:** React Three Fiber + Three.js
- **Deployment:** Vercel Edge + Blob Storage
- **Language:** TypeScript

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:2024](http://localhost:2024) to view the site.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
/app
  /layout.tsx          # Root layout with fonts
  /page.tsx            # Homepage with hero + mission
  /globals.css         # Global styles + design tokens

/components
  /hero
    /HeroSequence.tsx  # Scroll-driven hero with GSAP
  /mission
    /MissionGrid.tsx   # Mission cards section
    /MissionCard.tsx   # Individual card component
  /ui
    /Navigation.tsx    # Sticky nav with Headroom pattern

/public               # Static assets (images, fonts, models)
```

## Design System

See [DESIGN.md](./DESIGN.md) for complete visual language, color palette, typography scale, component architecture, and animation specifications.

## Key Features

- **Immersive Hero:** Scroll-driven sequence with parallax effects
- **Responsive Design:** Fluid typography and spacing across all viewports
- **Dark Mode First:** Surface tonal ladder with brand accent colors
- **Motion Design:** GSAP ScrollTrigger + Framer Motion for cinematic transitions
- **Accessibility:** WCAG 2.1 AA compliant, keyboard navigation, reduced motion support
- **Performance:** Optimized for Core Web Vitals (LCP < 2.5s, CLS < 0.1)

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push code to GitHub
2. Import repository to Vercel
3. Configure environment variables (if needed)
4. Deploy

### Environment Variables

Create `.env.local` for local development:

```env
# Vercel Blob Storage (optional)
BLOB_READ_WRITE_TOKEN=your_token_here
```

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
- `npm run type-check` — Run TypeScript compiler check

## Documentation

- [Pro.md](./EFSW_Website_Pro.md) — Complete project specification
- [DESIGN.md](./DESIGN.md) — Design system and component library
- [Presentation](./EFSW_Website_Proposal.pptx) — Executive deck with budget and timeline

## License

© 2026 Eurasia Forum for Social Workers. All rights reserved.
