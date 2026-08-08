# Eurasia Forum for Social Workers — Design System

## Overview

The Eurasia Forum for Social Workers design system is built for clarity, accessibility, and multilingual support across English, Thai, and Korean. It prioritizes legibility, semantic color, and fluid responsiveness to serve a global community of social workers.

### Design Philosophy

**Dark-first, depth through tonal layers**  
Six surface levels rise from near-black (#050A0D at 3% lightness) to elevated containers (20% lightness), each tinted toward cyan-blue (210° hue) to create depth without harsh contrast.

**Fluid by default**  
Typography, spacing, and layout scale smoothly via `clamp()` — no breakpoint-dependent overrides. Every size is a range, not a fixed value.

**Semantic color, never decoration**  
Teal (#2DD4BF) signals trust and connection; emerald (#34D399) represents growth and empowerment; amber (#FBBF24) provides warm contrast for advocacy moments. Color choices reinforce the brand pillars: **Connect · Empower · Advocate**.

**Accessibility non-negotiable**  
WCAG AA minimum across all text, focus states visible in all themes, reduced-motion support baked in, and semantic HTML enforced.

---

## Color System

### Surface Levels

Six dark surfaces tinted toward cyan-blue (210°), creating depth through tonal progression:

```css
:root {
  /* Surface levels — darkest to lightest */
  --surface-deepest: oklch(0.10 0.015 210);  /* #050A0D — App background */
  --surface-deep: oklch(0.15 0.018 210);     /* #0A1015 — Card backgrounds */
  --surface-mid: oklch(0.20 0.020 210);      /* #0F161D — Elevated panels */
  --surface-raised: oklch(0.25 0.022 210);   /* #152029 — Hover states */
  --surface-elevated: oklch(0.30 0.024 210); /* #1C2936 — Interactive elements */
  --surface-highest: oklch(0.35 0.026 210);  /* #243342 — Active states */
}
```

**Usage:**
- `--surface-deepest`: Page/app background, deepest container level
- `--surface-deep`: Card backgrounds, primary containers
- `--surface-mid`: Modal backgrounds, elevated panels
- `--surface-raised`: Hover states, secondary containers
- `--surface-elevated`: Input fields, interactive elements
- `--surface-highest`: Active states, emphasized containers

### Accent Colors

Luminous, high-saturation accents for interaction and emphasis:

```css
:root {
  /* Primary accent — teal for trust and connection */
  --accent-primary: oklch(0.78 0.14 180);      /* #2DD4BF */
  --accent-primary-hover: oklch(0.72 0.15 180); /* Darker on hover */
  
  /* Secondary accent — emerald for growth */
  --accent-secondary: oklch(0.78 0.13 155);    /* #34D399 */
  
  /* Muted accent — subtle highlights */
  --accent-muted: oklch(0.85 0.11 175);        /* #5EEAD4 */
  
  /* Warm accent — amber for advocacy */
  --accent-warm: oklch(0.82 0.14 85);          /* #FBBF24 */
}
```

**Usage:**
- `--accent-primary`: Primary CTAs, links, active states
- `--accent-secondary`: Secondary actions, highlights, success indicators
- `--accent-muted`: Subtle highlights, decorative accents, hover states
- `--accent-warm`: Special emphasis, advocacy moments, warmth contrast

### Semantic Colors

State indicators with vibrant and subtle variants:

```css
:root {
  /* Success */
  --success: oklch(0.72 0.18 145);        /* #22C55E */
  --success-subtle: oklch(0.38 0.10 145); /* #166534 */
  
  /* Warning */
  --warning: oklch(0.75 0.16 70);         /* #F59E0B */
  --warning-subtle: oklch(0.35 0.09 70);  /* #78350F */
  
  /* Danger */
  --danger: oklch(0.63 0.23 25);          /* #EF4444 */
  --danger-subtle: oklch(0.32 0.12 25);   /* #7F1D1D */
  
  /* Info */
  --info: oklch(0.62 0.20 250);           /* #3B82F6 */
  --info-subtle: oklch(0.35 0.12 250);    /* #1E3A8A */
}
```

**Usage:**
- Vibrant variants for foreground (icons, borders, text)
- Subtle variants for backgrounds and low-emphasis indicators
- Never use color alone — pair with iconography or text

### Text Colors

Derived from surface levels for readability:

```css
:root {
  --text-primary: oklch(0.95 0.01 210);   /* High contrast */
  --text-secondary: oklch(0.70 0.02 210); /* Muted content */
  --text-tertiary: oklch(0.50 0.02 210);  /* Metadata, captions */
  --text-disabled: oklch(0.35 0.01 210);  /* Disabled state */
  --text-inverse: oklch(0.10 0.015 210);  /* Text on light backgrounds */
}
```

---

## Typography System

### Font Families

```css
:root {
  --font-display: Inter, 'Noto Sans Thai', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-body: Inter, 'Noto Sans Thai', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace;
}

body {
  font-family: var(--font-body);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
}

code, pre {
  font-family: var(--font-mono);
}
```

**Rationale:**  
Inter provides exceptional clarity and legibility across Latin, Thai, and Korean scripts. Noto Sans Thai and Noto Sans KR serve as fallbacks to ensure consistent weight and x-height when Inter lacks complete coverage.

### Type Scale

Fluid typography scales smoothly from mobile to desktop:

```css
:root {
  /* Display — Hero headlines */
  --text-display: clamp(2.5rem, 1.8rem + 3.5vw, 5rem);
  --text-display-lh: 1.1;
  --text-display-ls: -0.03em;
  
  /* H1 — Page titles */
  --text-h1: clamp(2rem, 1.5rem + 2.5vw, 3.5rem);
  --text-h1-lh: 1.15;
  --text-h1-ls: -0.025em;
  
  /* H2 — Major sections */
  --text-h2: clamp(1.75rem, 1.4rem + 1.75vw, 2.75rem);
  --text-h2-lh: 1.2;
  --text-h2-ls: -0.02em;
  
  /* H3 — Card titles, modal headers */
  --text-h3: clamp(1.5rem, 1.25rem + 1.25vw, 2.25rem);
  --text-h3-lh: 1.25;
  --text-h3-ls: -0.015em;
  
  /* H4 — Minor headers */
  --text-h4: clamp(1.25rem, 1.1rem + 0.75vw, 1.75rem);
  --text-h4-lh: 1.3;
  --text-h4-ls: -0.01em;
  
  /* H5 — Small headers */
  --text-h5: clamp(1.125rem, 1rem + 0.625vw, 1.5rem);
  --text-h5-lh: 1.35;
  --text-h5-ls: -0.005em;
  
  /* H6 — Inline headers */
  --text-h6: clamp(1rem, 0.95rem + 0.25vw, 1.25rem);
  --text-h6-lh: 1.4;
  --text-h6-ls: 0;
  
  /* Body Large — Intro paragraphs */
  --text-body-lg: clamp(1.125rem, 1.05rem + 0.375vw, 1.375rem);
  --text-body-lg-lh: 1.7;
  
  /* Body — Default text */
  --text-body: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --text-body-lh: 1.6;
  
  /* Body Small — Secondary text */
  --text-body-sm: clamp(0.875rem, 0.85rem + 0.125vw, 1rem);
  --text-body-sm-lh: 1.65;
  --text-body-sm-ls: 0.005em;
  
  /* Caption — Fine print */
  --text-caption: clamp(0.75rem, 0.725rem + 0.125vw, 0.875rem);
  --text-caption-lh: 1.5;
  --text-caption-ls: 0.01em;
}
```

**Usage example:**

```css
.hero-title {
  font-size: var(--text-display);
  line-height: var(--text-display-lh);
  letter-spacing: var(--text-display-ls);
  font-weight: 700;
}

.card-title {
  font-size: var(--text-h3);
  line-height: var(--text-h3-lh);
  letter-spacing: var(--text-h3-ls);
  font-weight: 600;
}

.body-text {
  font-size: var(--text-body);
  line-height: var(--text-body-lh);
  font-weight: 400;
}
```

---

## Spacing System

Fluid spacing scales smoothly across viewports:

```css
:root {
  /* Spacing scale */
  --space-3xs: clamp(0.25rem, 0.2rem + 0.25vw, 0.375rem);   /* 4-6px */
  --space-2xs: clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem);      /* 8-12px */
  --space-xs: clamp(0.75rem, 0.65rem + 0.5vw, 1rem);        /* 12-16px */
  --space-sm: clamp(1rem, 0.8rem + 1vw, 1.5rem);            /* 16-24px */
  --space-md: clamp(1.5rem, 1rem + 2.5vw, 2.5rem);          /* 24-40px */
  --space-lg: clamp(2rem, 1rem + 5vw, 4rem);                /* 32-64px */
  --space-xl: clamp(3rem, 1.5rem + 7.5vw, 6rem);            /* 48-96px */
  --space-2xl: clamp(4rem, 2rem + 10vw, 8rem);              /* 64-128px */
  --space-3xl: clamp(6rem, 3rem + 15vw, 12rem);             /* 96-192px */
}
```

**Usage guidelines:**
- `3xs`: Icon-text gaps, chip padding
- `2xs`: Button vertical padding, small component padding
- `xs`: Card inner padding, form field padding
- `sm`: Section inner spacing, stacked element gaps
- `md`: Component margins, card spacing, grid gaps
- `lg`: Section vertical spacing, content block separation
- `xl`: Major section breaks, hero vertical spacing
- `2xl`: Large section dividers, page-level rhythm
- `3xl`: Maximum section spacing, hero top/bottom margins

### Layout Tokens

```css
:root {
  /* Container */
  --container-max: 80rem;            /* 1280px */
  --container-gutter: clamp(1rem, 0.5rem + 2.5vw, 2rem);
  
  /* Breakpoints (for JS or manual media queries) */
  --bp-mobile: 40rem;   /* 640px */
  --bp-tablet: 48rem;   /* 768px */
  --bp-desktop: 64rem;  /* 1024px */
  --bp-wide: 80rem;     /* 1280px */
}
```

### Border Radius

```css
:root {
  --radius-sm: 0.25rem;   /* 4px — checkboxes, small elements */
  --radius-md: 0.5rem;    /* 8px — inputs, small cards */
  --radius-lg: 0.75rem;   /* 12px — cards, panels */
  --radius-xl: 1rem;      /* 16px — modals, large cards */
  --radius-2xl: 1.5rem;   /* 24px — hero sections */
  --radius-full: 999px;   /* Pills, rounded buttons */
  --radius-circle: 50%;   /* Avatars, icon wells */
}
```

---

## Component Specifications

### Buttons

#### Primary Button

```css
.btn-primary {
  background: var(--accent-primary);
  color: var(--text-inverse);
  padding: clamp(0.75rem, 1.5vw, 1rem) clamp(1.5rem, 3vw, 2rem);
  border-radius: var(--radius-full);
  border: none;
  font-size: var(--text-body);
  font-weight: 600;
  cursor: pointer;
  transition: background 200ms var(--ease-smooth-out),
              transform 200ms var(--ease-smooth-out);
  
  /* Min touch target */
  min-height: 44px;
  min-width: 44px;
}

.btn-primary:hover {
  background: var(--accent-primary-hover);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0) scale(0.98);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.btn-primary:disabled {
  background: var(--surface-raised);
  color: var(--text-disabled);
  cursor: not-allowed;
}
```

#### Secondary Button

```css
.btn-secondary {
  background: transparent;
  color: var(--accent-primary);
  padding: clamp(0.75rem, 1.5vw, 1rem) clamp(1.5rem, 3vw, 2rem);
  border-radius: var(--radius-full);
  border: 1px solid color-mix(in oklch, var(--accent-primary) 40%, transparent);
  font-size: var(--text-body);
  font-weight: 600;
  cursor: pointer;
  transition: background 200ms var(--ease-smooth-out),
              border-color 200ms var(--ease-smooth-out);
}

.btn-secondary:hover {
  background: color-mix(in oklch, var(--accent-primary) 10%, transparent);
  border-color: var(--accent-primary);
}
```

#### Ghost Button

```css
.btn-ghost {
  background: transparent;
  color: var(--text-primary);
  padding: clamp(0.5rem, 1vw, 0.75rem) clamp(1rem, 2vw, 1.5rem);
  border-radius: var(--radius-full);
  border: none;
  font-size: var(--text-body);
  font-weight: 500;
  cursor: pointer;
  transition: background 200ms var(--ease-smooth-out);
}

.btn-ghost:hover {
  background: var(--surface-raised);
}
```

### Cards

#### News Card

```css
.card-news {
  background: var(--surface-deep);
  border: 1px solid var(--surface-mid);
  border-radius: var(--radius-lg);
  padding: clamp(1.5rem, 3vw, 2rem);
  transition: transform 300ms var(--ease-smooth-out),
              box-shadow 300ms var(--ease-smooth-out);
}

.card-news:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px color-mix(in oklch, var(--surface-deepest) 50%, transparent);
}

.card-news__image {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-sm);
}

.card-news__title {
  font-size: var(--text-h4);
  line-height: var(--text-h4-lh);
  letter-spacing: var(--text-h4-ls);
  font-weight: 600;
  margin-bottom: var(--space-xs);
}

.card-news__excerpt {
  font-size: var(--text-body-sm);
  line-height: var(--text-body-sm-lh);
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.card-news__meta {
  display: flex;
  gap: var(--space-sm);
  font-size: var(--text-caption);
  color: var(--text-tertiary);
}
```

#### Project Card

```css
.card-project {
  background: var(--surface-deep);
  border: 1px solid var(--surface-mid);
  border-radius: var(--radius-lg);
  padding: clamp(1.5rem, 3vw, 2rem);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  transition: transform 300ms var(--ease-smooth-out),
              border-color 300ms var(--ease-smooth-out);
}

.card-project:hover {
  transform: translateY(-2px);
  border-color: var(--accent-primary);
}

.card-project__header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: var(--space-sm);
}

.card-project__title {
  font-size: var(--text-h4);
  line-height: var(--text-h4-lh);
  letter-spacing: var(--text-h4-ls);
  font-weight: 600;
  color: var(--text-primary);
}

.card-project__status {
  flex-shrink: 0;
}

.card-project__description {
  font-size: var(--text-body-sm);
  line-height: var(--text-body-sm-lh);
  color: var(--text-secondary);
}

.card-project__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
}

.card-project__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-xs);
  border-top: 1px solid var(--surface-mid);
}

.card-project__members {
  display: flex;
  margin-left: calc(-1 * var(--space-2xs));
}

.card-project__avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-circle);
  border: 2px solid var(--surface-deep);
  margin-left: calc(-1 * var(--space-2xs));
}

.card-project__date {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
}
```

#### Profile Card

```css
.card-profile {
  background: var(--surface-deep);
  border: 1px solid var(--surface-mid);
  border-radius: var(--radius-lg);
  padding: clamp(1.5rem, 3vw, 2rem);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  transition: transform 300ms var(--ease-smooth-out);
}

.card-profile:hover {
  transform: translateY(-4px);
}

.card-profile__avatar {
  width: clamp(4rem, 8vw, 6rem);
  height: clamp(4rem, 8vw, 6rem);
  border-radius: var(--radius-circle);
  object-fit: cover;
  border: 3px solid var(--surface-raised);
}

.card-profile__name {
  font-size: var(--text-h5);
  line-height: var(--text-h5-lh);
  font-weight: 600;
  color: var(--text-primary);
  margin-top: var(--space-xs);
}

.card-profile__role {
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
}

.card-profile__bio {
  font-size: var(--text-body-sm);
  line-height: var(--text-body-sm-lh);
  color: var(--text-secondary);
  text-align: center;
}

.card-profile__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
  width: 100%;
  margin-top: var(--space-xs);
}

.card-profile__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-profile__stat-value {
  font-size: var(--text-h4);
  font-weight: 700;
  color: var(--accent-primary);
}

.card-profile__stat-label {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
}
```

### Form Inputs

#### Text Input

```css
.input {
  background: var(--surface-mid);
  color: var(--text-primary);
  border: 1px solid var(--surface-raised);
  border-radius: var(--radius-md);
  padding: clamp(0.75rem, 1.5vw, 1rem);
  font-size: var(--text-body);
  font-family: var(--font-body);
  width: 100%;
  transition: border-color 200ms var(--ease-smooth-out),
              box-shadow 200ms var(--ease-smooth-out);
}

.input:hover {
  border-color: var(--surface-elevated);
}

.input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent-primary) 20%, transparent);
}

.input::placeholder {
  color: var(--text-tertiary);
}

.input:disabled {
  background: var(--surface-deepest);
  color: var(--text-disabled);
  cursor: not-allowed;
}

.input[aria-invalid="true"] {
  border-color: var(--danger);
}

.input[aria-invalid="true"]:focus {
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--danger) 20%, transparent);
}
```

#### Textarea

```css
.textarea {
  background: var(--surface-mid);
  color: var(--text-primary);
  border: 1px solid var(--surface-raised);
  border-radius: var(--radius-md);
  padding: clamp(0.75rem, 1.5vw, 1rem);
  font-size: var(--text-body);
  font-family: var(--font-body);
  width: 100%;
  min-height: 120px;
  resize: vertical;
  transition: border-color 200ms var(--ease-smooth-out),
              box-shadow 200ms var(--ease-smooth-out);
}

.textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent-primary) 20%, transparent);
}
```

#### Select

```css
.select {
  background: var(--surface-mid);
  color: var(--text-primary);
  border: 1px solid var(--surface-raised);
  border-radius: var(--radius-md);
  padding: clamp(0.75rem, 1.5vw, 1rem);
  font-size: var(--text-body);
  font-family: var(--font-body);
  width: 100%;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23808080' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 3rem;
  transition: border-color 200ms var(--ease-smooth-out);
}

.select:hover {
  border-color: var(--surface-elevated);
}

.select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent-primary) 20%, transparent);
}
```

#### Checkbox

```css
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  cursor: pointer;
}

.checkbox {
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid var(--surface-raised);
  border-radius: var(--radius-sm);
  background: var(--surface-mid);
  cursor: pointer;
  position: relative;
  transition: background 200ms var(--ease-smooth-out),
              border-color 200ms var(--ease-smooth-out);
}

.checkbox:hover {
  border-color: var(--surface-elevated);
}

.checkbox:checked {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.checkbox:checked::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: solid var(--surface-deepest);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.checkbox-label {
  font-size: var(--text-body);
  color: var(--text-primary);
  user-select: none;
}
```

#### Radio Button

```css
.radio-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  cursor: pointer;
}

.radio {
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid var(--surface-raised);
  border-radius: var(--radius-circle);
  background: var(--surface-mid);
  cursor: pointer;
  position: relative;
  transition: background 200ms var(--ease-smooth-out),
              border-color 200ms var(--ease-smooth-out);
}

.radio:hover {
  border-color: var(--surface-elevated);
}

.radio:checked {
  border-color: var(--accent-primary);
}

.radio:checked::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: var(--radius-circle);
  background: var(--accent-primary);
}

.radio:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.radio-label {
  font-size: var(--text-body);
  color: var(--text-primary);
  user-select: none;
}
```

#### Form Field with Label and Error

```css
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.form-label {
  font-size: var(--text-body-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.form-label--required::after {
  content: '*';
  color: var(--danger);
  margin-left: 0.25rem;
}

.form-error {
  font-size: var(--text-body-sm);
  color: var(--danger);
  display: flex;
  align-items: center;
  gap: var(--space-3xs);
}

.form-hint {
  font-size: var(--text-body-sm);
  color: var(--text-tertiary);
}
```

### Navigation

#### Desktop Navigation

```css
.nav-desktop {
  position: sticky;
  top: 0;
  z-index: 100;
  background: color-mix(in oklch, var(--surface-deep) 90%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--surface-mid);
  padding: 1rem clamp(2rem, 5vw, 4rem);
}

.nav-desktop__list {
  display: flex;
  gap: var(--space-md);
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-desktop__link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--text-body);
  font-weight: 500;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  transition: color 200ms var(--ease-smooth-out),
              background 200ms var(--ease-smooth-out);
}

.nav-desktop__link:hover {
  color: var(--text-primary);
  background: var(--surface-raised);
}

.nav-desktop__link[aria-current="page"] {
  color: var(--accent-primary);
  background: color-mix(in oklch, var(--accent-primary) 15%, transparent);
}
```

### Badges

#### Solid Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3xs);
  padding: var(--space-3xs) var(--space-xs);
  border-radius: var(--radius-full);
  font-size: var(--text-caption);
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.badge--success {
  background: var(--success);
  color: var(--surface-deepest);
}

.badge--warning {
  background: var(--warning);
  color: var(--surface-deepest);
}

.badge--danger {
  background: var(--danger);
  color: var(--text-primary);
}

.badge--info {
  background: var(--info);
  color: var(--text-primary);
}

.badge--neutral {
  background: var(--surface-raised);
  color: var(--text-primary);
}
```

#### Outlined Badge

```css
.badge--outlined {
  background: transparent;
  border: 1px solid currentColor;
}

.badge--outlined.badge--success {
  color: var(--success);
}

.badge--outlined.badge--warning {
  color: var(--warning);
}

.badge--outlined.badge--danger {
  color: var(--danger);
}

.badge--outlined.badge--info {
  color: var(--info);
}
```

#### Dot Badge

```css
.badge--dot {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
}

.badge--dot::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: var(--radius-circle);
  background: currentColor;
}

.badge--dot.badge--success {
  color: var(--success);
}

.badge--dot.badge--warning {
  color: var(--warning);
}

.badge--dot.badge--danger {
  color: var(--danger);
}
```

### Modals

#### Modal Overlay

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: color-mix(in oklch, var(--surface-deepest) 80%, transparent);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  animation: fade-in var(--duration-base) var(--ease-smooth-out);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

#### Modal Content

```css
.modal {
  background: var(--surface-deep);
  border: 1px solid var(--surface-mid);
  border-radius: var(--radius-xl);
  padding: clamp(1.5rem, 3vw, 2rem);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px color-mix(in oklch, var(--surface-deepest) 60%, transparent);
  animation: modal-enter var(--duration-slow) var(--ease-expo-out);
}

@keyframes modal-enter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: var(--space-md);
}

.modal__title {
  font-size: var(--text-h3);
  line-height: var(--text-h3-lh);
  letter-spacing: var(--text-h3-ls);
  font-weight: 600;
  color: var(--text-primary);
}

.modal__close {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--space-2xs);
  border-radius: var(--radius-md);
  transition: background 200ms var(--ease-smooth-out),
              color 200ms var(--ease-smooth-out);
}

.modal__close:hover {
  background: var(--surface-raised);
  color: var(--text-primary);
}

.modal__body {
  color: var(--text-secondary);
  font-size: var(--text-body);
  line-height: var(--text-body-lh);
  margin-bottom: var(--space-md);
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  padding-top: var(--space-md);
  border-top: 1px solid var(--surface-mid);
}
```

### Sheets (Drawer)

```css
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: color-mix(in oklch, var(--surface-deepest) 80%, transparent);
  backdrop-filter: blur(4px);
  z-index: 1000;
  animation: fade-in var(--duration-base) var(--ease-smooth-out);
}

.sheet {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: min(400px, 90vw);
  background: var(--surface-deep);
  border-left: 1px solid var(--surface-mid);
  padding: clamp(1.5rem, 3vw, 2rem);
  overflow-y: auto;
  box-shadow: -8px 0 32px color-mix(in oklch, var(--surface-deepest) 50%, transparent);
  animation: slide-in-right var(--duration-slow) var(--ease-expo-out);
}

@keyframes slide-in-right {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.sheet--left {
  left: 0;
  right: auto;
  border-left: none;
  border-right: 1px solid var(--surface-mid);
  animation: slide-in-left var(--duration-slow) var(--ease-expo-out);
}

@keyframes slide-in-left {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}
```

### Dropdowns

```css
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown__trigger {
  background: var(--surface-mid);
  color: var(--text-primary);
  border: 1px solid var(--surface-raised);
  border-radius: var(--radius-md);
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-body);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  transition: background 200ms var(--ease-smooth-out),
              border-color 200ms var(--ease-smooth-out);
}

.dropdown__trigger:hover {
  background: var(--surface-raised);
  border-color: var(--surface-elevated);
}

.dropdown__menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 200px;
  background: var(--surface-deep);
  border: 1px solid var(--surface-mid);
  border-radius: var(--radius-lg);
  padding: var(--space-2xs);
  box-shadow: 0 8px 24px color-mix(in oklch, var(--surface-deepest) 50%, transparent);
  z-index: 100;
  animation: dropdown-enter var(--duration-fast) var(--ease-smooth-out);
}

@keyframes dropdown-enter {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown__item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  font-size: var(--text-body);
  color: var(--text-primary);
  cursor: pointer;
  transition: background 200ms var(--ease-smooth-out);
  white-space: nowrap;
}

.dropdown__item:hover {
  background: var(--surface-raised);
}

.dropdown__item--active {
  background: var(--surface-raised);
  color: var(--accent-primary);
}

.dropdown__divider {
  height: 1px;
  background: var(--surface-mid);
  margin: var(--space-2xs) 0;
}
```

### Loading States

#### Spinner

```css
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--surface-raised);
  border-top-color: var(--accent-primary);
  border-radius: var(--radius-circle);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner--lg {
  width: 48px;
  height: 48px;
  border-width: 4px;
}

.spinner--sm {
  width: 16px;
  height: 16px;
  border-width: 2px;
}
```

#### Skeleton

```css
.skeleton {
  background: var(--surface-raised);
  border-radius: var(--radius-md);
  animation: pulse 1.5s var(--ease-in-out) infinite;
  position: relative;
  overflow: hidden;
}

.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in oklch, var(--surface-elevated) 50%, transparent),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.skeleton--text {
  height: 1em;
  border-radius: var(--radius-sm);
}

.skeleton--circle {
  border-radius: var(--radius-circle);
  aspect-ratio: 1;
}

.skeleton--card {
  height: 200px;
}
```

### Toast Notifications

```css
.toast-container {
  position: fixed;
  bottom: var(--space-lg);
  right: var(--space-lg);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  pointer-events: none;
}

.toast {
  background: var(--surface-elevated);
  border: 1px solid var(--surface-raised);
  border-radius: var(--radius-lg);
  padding: var(--space-sm) var(--space-md);
  min-width: 300px;
  max-width: 500px;
  box-shadow: 0 8px 24px color-mix(in oklch, var(--surface-deepest) 60%, transparent);
  display: flex;
  align-items: start;
  gap: var(--space-sm);
  pointer-events: auto;
  animation: toast-enter var(--duration-base) var(--ease-spring);
}

@keyframes toast-enter {
  from {
    opacity: 0;
    transform: translateX(100%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.toast--success {
  border-left: 3px solid var(--success);
}

.toast--warning {
  border-left: 3px solid var(--warning);
}

.toast--danger {
  border-left: 3px solid var(--danger);
}

.toast--info {
  border-left: 3px solid var(--info);
}

.toast__icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.toast__content {
  flex: 1;
}

.toast__title {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-3xs);
}

.toast__message {
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
  line-height: var(--text-body-sm-lh);
}

.toast__close {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: var(--space-3xs);
  border-radius: var(--radius-sm);
  transition: background 200ms var(--ease-smooth-out),
              color 200ms var(--ease-smooth-out);
}

.toast__close:hover {
  background: var(--surface-raised);
  color: var(--text-primary);
}
```

---

## Animation Guidelines

### Easing Curves

```css
:root {
  --ease-smooth-out: cubic-bezier(0.33, 1, 0.68, 1);
  --ease-expo-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
}
```

**Usage:**
- `smooth-out`: Default for UI element entrances, dropdowns, tooltips
- `expo-out`: Dramatic reveals, hero sections, page transitions
- `spring`: Interactive elements with slight overshoot (buttons, modals)
- `in-out`: Symmetric motions (carousels, sliders)

### Durations

```css
:root {
  --duration-instant: 0ms;
  --duration-fast: 200ms;
  --duration-base: 300ms;
  --duration-slow: 500ms;
  --duration-slower: 800ms;
}
```

### Common Animations

#### Fade In Up

```css
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fade-in-up var(--duration-slower) var(--ease-expo-out) both;
}
```

#### Scale In

```css
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.scale-in {
  animation: scale-in var(--duration-base) var(--ease-spring) both;
}
```

#### Loading Pulse

```css
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.loading-pulse {
  animation: pulse 1.5s var(--ease-in-out) infinite;
}
```

### Scroll Animations

Common scroll-triggered animations:

| Animation | Effect | Threshold | Usage |
|-----------|--------|-----------|-------|
| fade-in-up | Fade + translate Y 40px → 0 | 0.1 | Default for content sections, cards |
| stagger-children | Fade + slide with 80ms delay | 0.15 | Lists, grids, feature cards |
| parallax-slow | Translate Y at 0.3x scroll speed | 0 | Background images, decorative elements |
| parallax-fast | Translate Y at 1.5x scroll speed | 0 | Foreground elements |
| scale-in | Scale from 0.9 + fade | 0.2 | Hero images, large media |
| reveal-left | Clip-path reveal from left | 0.25 | Headings, text blocks |
| counter-up | Number count from 0 to target | 0.3 | Statistics, metrics |

### Micro-interactions

| Interaction | Element | Effect | Usage |
|-------------|---------|--------|-------|
| button-ripple | Button, clickable card | Radial expand from click point | Click feedback |
| card-hover-lift | Card, product tile | Translate Y -4px + shadow + scale 1.02 | Hover state for cards |
| link-underline | Text link, nav item | Underline scale X from 0 → 1 | Link hover animation |
| icon-bounce | Icon button, success icon | Scale to 1.2 then spring back | Success states |
| input-focus | Input, textarea | Border color + ring scale | Form focus states |
| loading-pulse | Skeleton, loading state | Opacity 0.4 → 1 → 0.4 loop | Loading placeholders |
| toggle-switch | Toggle, checkbox | Thumb slide + color shift + spring | Toggle switches |
| magnetic-hover | Large button, CTA | Element moves toward cursor | Premium CTAs |

### Reduced Motion

Always respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Animation Implementation

### Framer Motion

```tsx
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const easings = {
  smoothOut: [0.33, 1, 0.68, 1],
  expoOut: [0.16, 1, 0.3, 1],
  spring: { type: 'spring', stiffness: 300, damping: 30 }
};

// Page transition
const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -24 }
};

function PageTransition({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.5, ease: easings.expoOut }}
    >
      {children}
    </motion.div>
  );
}

// Scroll-triggered fade in
function FadeInUp({ children, delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: easings.expoOut }}
    >
      {children}
    </motion.div>
  );
}

// Button with spring
function Button({ children, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={easings.spring}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
```

### GSAP

```javascript
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Respect reduced motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(100);
}

// Fade in on scroll
function fadeInUp(elements) {
  gsap.from(elements, {
    scrollTrigger: {
      trigger: elements,
      start: 'top 90%',
      toggleActions: 'play none none none'
    },
    y: 40,
    opacity: 0,
    duration: 0.8,
    ease: 'expo.out'
  });
}

// Parallax
function parallax(element, speed = 0.3) {
  gsap.to(element, {
    scrollTrigger: {
      trigger: element,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true
    },
    y: (i, target) => -ScrollTrigger.maxScroll(window) * speed,
    ease: 'none'
  });
}

// Usage
document.addEventListener('DOMContentLoaded', () => {
  fadeInUp('.fade-in');
  parallax('.parallax', 0.3);
});
```

---

## Accessibility Standards

### Color Contrast

- **Body text (16px+):** Minimum 4.5:1 contrast ratio (WCAG AA)
- **Large text (24px+):** Minimum 3:1 contrast ratio
- **Interactive elements:** Minimum 3:1 against background
- **Focus indicators:** Minimum 3:1 contrast, visible on all focusable elements

### Focus States

All interactive elements must have visible focus indicators:

```css
:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
```

### Touch Targets

Minimum 44×44px for all interactive elements:

```css
button, a, input, select, textarea {
  min-height: 44px;
  min-width: 44px;
}
```

### Semantic HTML

- Use `<nav>` for navigation
- Use `<main>` for primary content
- Use `<article>` for news/blog posts
- Use `<section>` for thematic groupings
- Use `<button>` for actions, `<a>` for navigation
- Use proper heading hierarchy (h1 → h2 → h3, no skipping)

### ARIA Labels

- Always provide `aria-label` for icon-only buttons
- Use `aria-current="page"` for current navigation item
- Use `aria-invalid="true"` for form errors
- Use `aria-describedby` to associate error messages with inputs
- Use `aria-live="polite"` for dynamic content updates

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Modal/dialog focus trapped when open
- ESC key closes overlays
- Arrow keys navigate menus and dropdowns
- Focus returned to trigger when closing

---

## Implementation Notes

### CSS Custom Properties

Define all tokens in `:root` and reference via `var()`:

```css
:root {
  /* Define tokens */
  --surface-deep: oklch(0.15 0.018 210);
  --accent-primary: oklch(0.78 0.14 180);
  --text-body: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
}

/* Consume tokens */
.card {
  background: var(--surface-deep);
  color: var(--text-primary);
  font-size: var(--text-body);
}
```

### Grid-First Layout

Use CSS Grid for page structure, section rhythm, and card layouts:

```css
.grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
  gap: var(--space-md);
}

.grid-hero {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-lg);
}

@media (min-width: 48rem) {
  .grid-hero {
    grid-template-columns: 1fr 1fr;
  }
}
```

### Component Isolation

Prefix component classes to avoid collisions:

```css
/* Good */
.efsw-card { }
.efsw-button { }
.efsw-nav { }

/* Avoid */
.card { }
.button { }
.nav { }
```

---

## Best Practices

### Do

✅ Use `clamp()` for all sizing — type, spacing, and layout  
✅ Reference tokens via `var()` — never hard-code colors or sizes  
✅ Test with Thai and Korean text — ensure line-height and spacing work  
✅ Provide focus states for all interactive elements  
✅ Use semantic HTML and ARIA attributes  
✅ Test with keyboard navigation and screen readers  
✅ Respect `prefers-reduced-motion`  
✅ Use CSS Grid for layout, Flexbox for component internals  
✅ Keep touch targets 44×44px minimum  
✅ Maintain 4.5:1 contrast ratio for body text  

### Don't

❌ Hard-code colors — always use tokens  
❌ Use fixed pixel sizes — prefer `clamp()` and `rem`  
❌ Skip focus states — accessibility non-negotiable  
❌ Use color alone to convey information  
❌ Nest media queries deep in components — keep layout queries at root  
❌ Override user font-size preferences — use `rem` not `px`  
❌ Forget Thai/Korean fallback fonts — test multilingual content  
❌ Create touch targets smaller than 44px  
❌ Animate without checking `prefers-reduced-motion`  
❌ Use `div` when semantic HTML exists  

---

## Quick Reference

### Most-Used Tokens

```css
/* Surfaces */
--surface-deep
--surface-raised
--surface-elevated

/* Accents */
--accent-primary
--accent-secondary
--accent-warm

/* Text */
--text-primary
--text-secondary
--text-tertiary

/* Typography */
--text-h1, --text-h2, --text-h3
--text-body, --text-body-lg, --text-body-sm
--text-caption

/* Spacing */
--space-xs, --space-sm, --space-md
--space-lg, --space-xl

/* Radius */
--radius-lg, --radius-full, --radius-circle

/* Easing */
--ease-smooth-out, --ease-expo-out, --ease-spring

/* Durations */
--duration-fast, --duration-base, --duration-slow
```

---

## Design System Summary

### Key Metrics

- **Surface Levels:** 6 dark surfaces (3% to 20% lightness)
- **Accent Colors:** 4 (primary teal, secondary emerald, muted teal, warm amber)
- **Type Scales:** 11 fluid scales (display to caption)
- **Spacing Steps:** 9 fluid steps (3xs to 3xl)
- **Components Specified:** 19 core components
- **Animation Patterns:** 14 transitions and micro-interactions

### Color Rationale

Chose teal/cyan (180°) as the primary hue to evoke **trust, care, and connection** — central values in social work. The palette steps through six dark surfaces tinted toward cyan-blue (210°), rising from 3% to 20% lightness to create depth without harsh contrast. Primary accent (#2DD4BF) is a luminous teal at 78% lightness and high saturation for CTAs and links. Secondary emerald (#34D399) reinforces themes of growth and empowerment. A warm amber accent (#FBBF24) provides contrast for advocacy moments. The entire system supports dark-mode-first design while maintaining WCAG AA contrast for international text (EN/TH/KR) across all three brand pillars: **Connect · Empower · Advocate**.

### Typography Rationale

Inter chosen as the primary typeface for all three languages because it provides exceptional clarity and legibility across Latin, Thai, and Korean scripts. Its extensive character set, careful optical sizing, and open apertures make it ideal for multilingual content. Noto Sans Thai and Noto Sans KR serve as fallbacks to ensure consistent weight and x-height matching when Inter lacks complete coverage for Thai and Korean glyphs, maintaining visual harmony across language switches.

Display sizes use tight negative tracking (-0.03em to -0.015em) and compressed line-height (1.1-1.25) to create visual impact and reduce vertical rhythm disruption — critical when large Thai or Korean glyphs appear inline with Latin text. Body sizes shift to generous line-height (1.6-1.7) and neutral or slightly positive tracking to improve readability for extended reading in all three scripts.

---

**Version:** 2.0.0  
**Last Updated:** 2026-08-08  
**Maintained by:** Eurasia Forum for Social Workers Design Team  
**Design System Created:** Multi-agent workflow analysis and synthesis
