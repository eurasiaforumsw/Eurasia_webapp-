# Axion Studio Light Design System

This page is a bright, editorial portfolio for Axion Studio. It keeps the source brief's three-part narrative: a full-viewport hero, a white studio introduction, and a light-gray project grid.

## Direction

- Macrostructure: Portfolio Grid
- Navigation: compact pill bar, N1b
- Footer: intentionally omitted; the brief ends on selected work
- Hallmark axes: light / geometric sans / chromatic terracotta
- Enrichment: WebGPU shader stack with a static CSS fallback
- Motion: short, purposeful transitions; video autoplay is disabled for reduced-motion and Save-Data users

## Tokens

:root {
  --color-paper: #ffffff;
  --color-paper-2: #f5f5f5;
  --color-ink: #171717;
  --color-ink-2: #454545;
  --color-muted: #6e6e6e;
  --color-accent: #f26522;
  --color-accent-hover: #df5719;
  --color-rule: #d7d7d7;
  --font-display: Bricolage Grotesque, sans-serif;
  --font-body: Inter, sans-serif;
  --radius-card: 1rem;
  --radius-pill: 999px;
}

The orange accent is reserved for primary actions, numbered section markers, and media controls. White and #F5F5F5 provide the light surface rhythm; ink text carries the contrast.

## Type

Bricolage Grotesque is used for display headings and project names. Inter is used for body copy, metadata, and navigation. Display copy uses a fluid clamp with a 4.25rem ceiling and zero letter-spacing so long headings remain stable on narrow screens.

## Layout

The content frame is capped at 1440px with a fluid 20px-to-64px gutter. The About section switches from a stacked mobile layout to a 26% / flexible / 48% three-column composition at 1024px. Work cards use a 4:3 landscape media ratio for Narrativ and a square ratio for Luminar.

## Interaction contract

- Every navigation link lands on a real section ID.
- Buttons use familiar Lucide icons and remain at least 48px high on coarse pointers.
- The mobile menu is a bottom sheet with an overlay, Escape support, and body scroll lock.
- Video previews are muted, looped, and explicitly controllable. No width animation is used for the control.
- Focus states use a 3px terracotta outline with a 3px offset.
- The shader is decorative and has a CSS fallback for unavailable WebGPU and reduced-motion contexts.

## Content and media

The headline, About copy, project names, descriptions, and media URLs come from the Axion Studio brief. No unverified awards, clients, addresses, or contact details are added to the page.
