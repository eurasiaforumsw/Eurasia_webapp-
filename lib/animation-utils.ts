/**
 * Animation Utilities - Documentation
 *
 * This file provides reusable Framer Motion animation variants for the Academic Document page.
 * All animations follow WCAG 2.1 guidelines and respect prefers-reduced-motion.
 */

// ============================================================================
// Core Animation Variants
// ============================================================================

export {
  fadeInUp,
  staggerChildren,
  scaleOnHover,
  slideInFromLeft,
  slideInFromRight,
  shimmer,
  pulseGlow,
  cardHoverLift,
  staggerGrid,
  gridItem
} from './animation-variants';

// ============================================================================
// CSS Animation Classes (defined in globals.css)
// ============================================================================

/**
 * Marquee Infinite Scroll
 * Class: academic-marquee-animate
 * Duration: 40s (desktop), 30s (mobile)
 * Pauses on hover/focus
 */

/**
 * Shimmer Loading Effect
 * Class: academic-shimmer
 * Duration: 2s infinite
 */

/**
 * Skeleton Loader
 * Class: academic-skeleton
 * - Base loading state with shimmer animation
 */

/**
 * Fade In Up
 * Class: academic-fade-in-up
 * Duration: 600ms
 * Easing: cubic-bezier(0.16, 1, 0.3, 1)
 */

/**
 * Stagger Animation
 * Classes: academic-stagger-item
 * - Apply to children for staggered entrance
 * - nth-child delays: 0ms, 80ms, 160ms, 240ms...
 */

/**
 * Pulse Scale
 * Class: academic-pulse
 * Duration: 2s infinite
 */

/**
 * Glow Pulse
 * Class: academic-glow-animate
 * Duration: 3s infinite
 */

// ============================================================================
// Accessibility Classes
// ============================================================================

/**
 * Focus Ring
 * Class: academic-focus-ring
 * - 2px solid rgba(56, 189, 248, 0.8) outline
 * - 3px offset
 * - Applies only on :focus-visible
 */

/**
 * Skip Link
 * Class: academic-skip-link
 * - Hidden by default
 * - Visible on focus
 */

/**
 * Screen Reader Only
 * Class: academic-sr-only
 * - Visually hidden but accessible to screen readers
 */

// ============================================================================
// Responsive Grid
// ============================================================================

/**
 * Responsive Grid Layout
 * Class: academic-grid-responsive
 * - Mobile (< 640px): 1 column
 * - Tablet (640px - 1023px): 2 columns
 * - Desktop (≥ 1024px): 3 columns
 */

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example 1: Framer Motion fade in up
 *
 * import { motion } from 'framer-motion';
 * import { fadeInUp } from '@/lib/animation-utils';
 *
 * <motion.div variants={fadeInUp} initial="initial" animate="animate">
 *   Content
 * </motion.div>
 */

/**
 * Example 2: Stagger children animation
 *
 * import { motion } from 'framer-motion';
 * import { staggerChildren, gridItem } from '@/lib/animation-utils';
 *
 * <motion.div variants={staggerChildren} initial="initial" animate="animate">
 *   {items.map(item => (
 *     <motion.div key={item.id} variants={gridItem}>
 *       {item.content}
 *     </motion.div>
 *   ))}
 * </motion.div>
 */

/**
 * Example 3: CSS animation classes
 *
 * // Skeleton loader
 * <div className="academic-skeleton w-24 h-24 rounded-full" />
 *
 * // Fade in with stagger
 * <div className="academic-fade-in-up academic-stagger-item">
 *   Content
 * </div>
 *
 * // Responsive grid
 * <div className="academic-grid-responsive">
 *   {items.map(item => <Card key={item.id} {...item} />)}
 * </div>
 */

/**
 * Example 4: Accessibility
 *
 * // Focus ring
 * <button className="academic-focus-ring">Click me</button>
 *
 * // Screen reader only text
 * <span className="academic-sr-only">Additional context for screen readers</span>
 *
 * // Skip link
 * <a href="#main-content" className="academic-skip-link">
 *   Skip to main content
 * </a>
 */
