'use client';

/**
 * Skip Link Component
 *
 * Provides a "Skip to main content" link for keyboard users.
 * Improves accessibility by allowing users to bypass navigation.
 *
 * WCAG 2.1 Success Criterion 2.4.1 (Level A): Bypass Blocks
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
      style={{
        position: 'absolute',
        top: '-100px',
        left: 'var(--space-sm, 0.5rem)',
        padding: 'var(--space-sm, 0.5rem) var(--space-md, 1rem)',
        backgroundColor: 'var(--accent-primary, #38BDF8)',
        color: 'var(--text-inverse, #0A0D12)',
        fontWeight: 'var(--font-semibold, 600)',
        fontSize: 'var(--text-sm, 0.875rem)',
        borderRadius: 'var(--radius-md, 0.375rem)',
        textDecoration: 'none',
        zIndex: 'var(--z-tooltip, 1600)',
        transition: 'top var(--transition-fast, 150ms ease-in-out)',
        boxShadow: 'var(--shadow-lg)',
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = 'var(--space-sm, 0.5rem)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-100px';
      }}
    >
      ข้ามไปยังเนื้อหาหลัก
    </a>
  );
}
