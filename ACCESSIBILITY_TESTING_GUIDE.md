# Accessibility Testing Guide & Verification Checklist

**Project:** EFSW Web Application  
**Date:** 2026-10-07  
**Fixes Implemented:** Phase 1 Critical Accessibility Issues

---

## Executive Summary

This guide covers testing procedures for the following accessibility fixes:

1. **Input Component** - Label associations and ARIA attributes
2. **Skip Navigation Links** - Keyboard navigation bypass
3. **HTML Lang Attribute** - Dynamic language detection
4. **ContentEditorModal** - Focus trap and keyboard management
5. **AdminSidebar** - Keyboard navigation and shortcuts

---

## 1. Input Component Testing

### Files Modified
- `/components/ui/input.tsx`

### What Was Fixed
- Added unique ID generation for each input instance
- Proper `<label>` association using `htmlFor` attribute
- ARIA attributes: `aria-invalid`, `aria-describedby`
- Error messages with `role="alert"` and `aria-live="polite"`

### Manual Testing Checklist

#### Visual Inspection
- [ ] Labels are visible and positioned correctly
- [ ] Floating labels animate on focus
- [ ] Error messages appear below inputs
- [ ] Focus rings are visible and distinct

#### Keyboard Testing
- [ ] Tab through form inputs in logical order
- [ ] Labels remain visible when using keyboard navigation
- [ ] Error states are clearly indicated
- [ ] Focus indicator is visible on all inputs

#### Screen Reader Testing (VoiceOver/NVDA)
- [ ] **Test 1:** Navigate to an input field
  - Expected: Screen reader announces label text
  - Expected: Screen reader announces field type (e.g., "text field", "email field")
  
- [ ] **Test 2:** Focus input with error
  - Expected: Screen reader announces error message
  - Expected: Announces "invalid" state
  
- [ ] **Test 3:** Type in input field
  - Expected: Screen reader provides feedback for typed characters
  - Expected: No unexpected announcements

#### Code Verification
```bash
# Check that all Input components have labels
grep -r "<Input" app/ components/ --include="*.tsx" | wc -l

# Verify no missing label warnings in console
# Open browser DevTools Console and check for warnings
```

#### Test Cases

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| TC-001 | Click label text | Input receives focus | ⬜ |
| TC-002 | Tab to input with error | Screen reader announces error | ⬜ |
| TC-003 | Type in floating label input | Label floats up smoothly | ⬜ |
| TC-004 | Use form validation | Error messages are announced | ⬜ |

---

## 2. Skip Navigation Links

### Files Modified
- `/app/layout.tsx`

### What Was Fixed
- Added skip link: "Skip to main content"
- Positioned with `.sr-only` (screen reader only)
- Visible on keyboard focus
- Links to `#main-content` anchor

### Manual Testing Checklist

#### Keyboard Testing
- [ ] **Test 1:** Load any page and press Tab once
  - Expected: Skip link becomes visible at top-left
  - Expected: Link has clear focus indicator
  
- [ ] **Test 2:** Press Enter on skip link
  - Expected: Focus moves to main content area
  - Expected: Page does not reload
  
- [ ] **Test 3:** Press Tab again after skipping
  - Expected: Next focusable element after main content receives focus

#### Screen Reader Testing
- [ ] **Test 1:** VoiceOver/NVDA announces skip link as first element
- [ ] **Test 2:** Activating skip link moves virtual cursor to main content
- [ ] **Test 3:** Skip link text is clear: "Skip to main content"

#### Visual Testing
- [ ] Skip link is invisible by default
- [ ] Skip link appears on focus with high contrast
- [ ] Skip link has appropriate styling (background, padding, shadow)
- [ ] Skip link z-index ensures it appears above all content

#### Browser Compatibility
- [ ] Chrome/Edge: Skip link works correctly
- [ ] Firefox: Skip link works correctly
- [ ] Safari: Skip link works correctly

#### Test Cases

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| TC-005 | Press Tab on homepage | Skip link appears | ⬜ |
| TC-006 | Activate skip link | Focus moves to main | ⬜ |
| TC-007 | Navigate without keyboard | Skip link never appears | ⬜ |

---

## 3. HTML Lang Attribute (Dynamic)

### Files Modified
- `/app/layout.tsx`

### What Was Fixed
- `lang` attribute set from server-side cookie
- Client-side script updates `lang` from localStorage
- Supports: `en`, `th`, `ko`

### Manual Testing Checklist

#### Functional Testing
- [ ] **Test 1:** Default language
  - Clear cookies and localStorage
  - Load page
  - Expected: `<html lang="th">` (default)
  
- [ ] **Test 2:** Change language to English
  - Use language switcher
  - Reload page
  - Expected: `<html lang="en">`
  
- [ ] **Test 3:** Change language to Korean
  - Use language switcher
  - Reload page
  - Expected: `<html lang="ko">`

#### Screen Reader Testing
- [ ] VoiceOver/NVDA switches voice/pronunciation based on lang
- [ ] Thai text is pronounced correctly when `lang="th"`
- [ ] English text is pronounced correctly when `lang="en"`
- [ ] Korean text is pronounced correctly when `lang="ko"`

#### Browser DevTools Verification
```javascript
// Run in browser console
document.documentElement.lang
// Should return: "en", "th", or "ko"

// Check localStorage
localStorage.getItem('efsw.locale')
// Should match lang attribute
```

#### Test Cases

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| TC-008 | Fresh load (no cookies) | lang="th" | ⬜ |
| TC-009 | Switch to English | lang="en" persists | ⬜ |
| TC-010 | Switch to Korean | lang="ko" persists | ⬜ |
| TC-011 | Refresh page | lang attribute maintained | ⬜ |

---

## 4. ContentEditorModal - Focus Management

### Files Modified
- `/components/admin/modals/ContentEditorModal.tsx`

### What Was Fixed
- Proper `role="dialog"` attribute
- `aria-label` for dialog identification
- Focus trap not yet implemented (requires additional work)
- Keyboard shortcuts for common actions

### Manual Testing Checklist

#### Keyboard Testing
- [ ] **Test 1:** Open modal
  - Expected: Modal receives focus
  - Expected: Can tab through form fields
  
- [ ] **Test 2:** Press Escape
  - Expected: Modal closes
  - Expected: Focus returns to trigger button
  
- [ ] **Test 3:** Tab through all fields
  - Expected: Logical tab order
  - Expected: Cannot tab outside modal (focus trap)

#### Screen Reader Testing
- [ ] **Test 1:** Modal opens
  - Expected: Announces "Edit content" or "Create content" dialog
  
- [ ] **Test 2:** Navigate form fields
  - Expected: All labels are announced
  - Expected: Required fields are indicated
  
- [ ] **Test 3:** Error states
  - Expected: Validation errors are announced

#### Focus Management
- [ ] Focus moves to first input when modal opens
- [ ] Tab order follows visual layout
- [ ] Shift+Tab works in reverse
- [ ] Focus cannot escape modal (trapped)
- [ ] Focus returns to trigger when modal closes

#### Test Cases

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| TC-012 | Open content editor | Dialog announced | ⬜ |
| TC-013 | Tab through form | Logical order | ⬜ |
| TC-014 | Press Escape | Modal closes | ⬜ |
| TC-015 | Try to tab outside modal | Focus stays trapped | ⬜ |

---

## 5. AdminSidebar - Keyboard Navigation

### Files Modified
- `/components/admin/AdminSidebar.tsx`

### What Was Fixed
- Arrow key navigation (Up/Down/Home/End)
- Keyboard shortcuts (Cmd/Ctrl + 1-8)
- Focus trap for mobile drawer
- Proper ARIA attributes: `aria-current`, `aria-label`, `aria-keyshortcuts`
- Focus management on mobile open/close

### Manual Testing Checklist

#### Desktop Keyboard Navigation
- [ ] **Test 1:** Arrow Down
  - Expected: Moves focus to next menu item
  
- [ ] **Test 2:** Arrow Up
  - Expected: Moves focus to previous menu item
  
- [ ] **Test 3:** Home key
  - Expected: Moves focus to first menu item
  
- [ ] **Test 4:** End key
  - Expected: Moves focus to last menu item
  
- [ ] **Test 5:** Cmd/Ctrl + [1-8]
  - Expected: Activates corresponding menu item
  - Expected: Focus moves to selected item

#### Mobile Focus Trap
- [ ] **Test 1:** Open mobile menu
  - Expected: Focus moves to close button
  - Expected: Can tab through menu items
  
- [ ] **Test 2:** Tab forward to last item
  - Expected: Next tab returns to first item
  
- [ ] **Test 3:** Shift+Tab from first item
  - Expected: Focus moves to last item
  
- [ ] **Test 4:** Press Escape
  - Expected: Mobile menu closes
  - Expected: Focus returns to menu button

#### Screen Reader Testing
- [ ] **Test 1:** Navigate to sidebar
  - Expected: Announces "Admin navigation"
  
- [ ] **Test 2:** Focus menu item
  - Expected: Announces label and subtitle
  - Expected: Announces if current page ("current page")
  - Expected: Announces keyboard shortcut
  
- [ ] **Test 3:** Badge counts
  - Expected: "2 pending items" announced

#### Visual Testing
- [ ] Focus indicators are visible on all items
- [ ] Active item has distinct styling
- [ ] Keyboard shortcut hints appear on hover/focus
- [ ] Badge counts are readable

#### Test Cases

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| TC-016 | Press Arrow Down | Next item focused | ⬜ |
| TC-017 | Press Home | First item focused | ⬜ |
| TC-018 | Press Cmd+3 | Content view activated | ⬜ |
| TC-019 | Open mobile menu | Focus trapped | ⬜ |
| TC-020 | Press Escape (mobile) | Menu closes | ⬜ |

---

## Browser Compatibility Testing

Test all features across major browsers:

### Desktop Browsers

| Browser | Version | Skip Links | Keyboard Nav | Screen Reader | Status |
|---------|---------|------------|--------------|---------------|--------|
| Chrome | Latest | ⬜ | ⬜ | ⬜ | ⬜ |
| Firefox | Latest | ⬜ | ⬜ | ⬜ | ⬜ |
| Safari | Latest | ⬜ | ⬜ | ⬜ | ⬜ |
| Edge | Latest | ⬜ | ⬜ | ⬜ | ⬜ |

### Mobile Browsers

| Browser | OS | Focus Trap | Touch + KB | Screen Reader | Status |
|---------|-----|------------|------------|---------------|--------|
| Safari | iOS | ⬜ | ⬜ | ⬜ | ⬜ |
| Chrome | Android | ⬜ | ⬜ | ⬜ | ⬜ |

---

## Screen Reader Testing Guide

### VoiceOver (macOS/iOS)

#### Setup
1. **macOS:** Cmd + F5 to enable VoiceOver
2. **iOS:** Settings > Accessibility > VoiceOver

#### Navigation Commands
- `VO + Right Arrow` - Next item
- `VO + Left Arrow` - Previous item
- `VO + A` - Read from current position
- `Control` - Stop speaking
- `Tab` - Next focusable element

#### Testing Procedure
1. Enable VoiceOver
2. Navigate to EFSW webapp
3. Use Tab to navigate through interactive elements
4. Verify all labels and descriptions are announced
5. Test form inputs, buttons, and navigation
6. Verify error messages are announced
7. Test modal dialogs and focus traps

### NVDA (Windows)

#### Setup
1. Download NVDA from nvaccess.org
2. Install and launch NVDA
3. NVDA + N for NVDA menu

#### Navigation Commands
- `Tab` - Next focusable element
- `Shift + Tab` - Previous focusable element
- `Insert + Down Arrow` - Start reading
- `Control` - Stop speaking
- `Insert + F7` - Elements list

#### Testing Procedure
1. Launch NVDA
2. Open EFSW webapp in browser
3. Press Insert + Down Arrow to start reading
4. Use Tab to navigate interactive elements
5. Test form inputs and validation
6. Test navigation and skip links
7. Verify modal announcements

### JAWS (Windows)

#### Setup
1. Install JAWS (commercial license required)
2. Launch JAWS

#### Navigation Commands
- `Tab` - Next focusable element
- `H` - Next heading
- `F` - Next form field
- `Insert + F5` - Form fields list
- `Insert + F7` - Links list

---

## Automated Testing

### axe DevTools

#### Installation
```bash
# Chrome Extension
# Install from Chrome Web Store: "axe DevTools"
```

#### Usage
1. Open Chrome DevTools (F12)
2. Navigate to "axe DevTools" tab
3. Click "Scan ALL of my page"
4. Review issues by severity:
   - Critical
   - Serious
   - Moderate
   - Minor

#### Expected Results
- **Critical issues:** 0
- **Serious issues:** ≤ 2 (known limitations)
- **All Input labels:** Pass
- **Lang attribute:** Pass
- **ARIA attributes:** Pass

### Lighthouse Accessibility Audit

#### Usage
1. Open Chrome DevTools
2. Navigate to "Lighthouse" tab
3. Select "Accessibility" category
4. Click "Analyze page load"

#### Target Scores
- **Accessibility Score:** ≥ 90
- **Best Practices:** ≥ 85

### Pa11y CI (Command Line)

```bash
# Install Pa11y
npm install -g pa11y

# Test homepage
pa11y http://localhost:3000

# Test admin panel
pa11y http://localhost:3000/admin

# Expected: 0 errors for critical issues
```

---

## Known Limitations

### Not Yet Fixed (Future Work)

1. **ContentEditorModal Focus Trap**
   - Status: Partial implementation
   - Issue: Focus can escape modal in some scenarios
   - Priority: High
   - Target: Phase 2

2. **Color Contrast in Some Components**
   - Status: Not addressed in Phase 1
   - Issue: Some text/background combinations may not meet WCAG AA
   - Priority: Medium
   - Target: Phase 2

3. **Touch Target Sizes**
   - Status: Not systematically reviewed
   - Issue: Some buttons may be smaller than 44x44px
   - Priority: Medium
   - Target: Phase 2

4. **Live Regions for Dynamic Content**
   - Status: Not implemented
   - Issue: Content updates may not be announced
   - Priority: Medium
   - Target: Phase 3

5. **Keyboard Navigation in Rich Text Editor**
   - Status: Depends on TipTap defaults
   - Issue: May need custom keyboard shortcuts
   - Priority: Low
   - Target: Phase 3

---

## Testing Workflow

### Pre-Deployment Checklist

- [ ] All manual test cases passed
- [ ] Screen reader testing completed (VoiceOver or NVDA)
- [ ] Keyboard navigation verified on all pages
- [ ] axe DevTools scan shows 0 critical issues
- [ ] Lighthouse accessibility score ≥ 90
- [ ] Browser compatibility verified (Chrome, Firefox, Safari)
- [ ] Mobile testing completed (iOS Safari or Android Chrome)

### Regression Testing

After future changes, re-test:

1. **Input components** - Any form changes
2. **Skip links** - Layout changes
3. **Lang attribute** - I18n changes
4. **Modals** - Any modal updates
5. **Navigation** - Menu/sidebar changes

### Continuous Monitoring

```bash
# Add to CI/CD pipeline

# 1. Lighthouse CI
npm install -g @lhci/cli
lhci autorun --collect.url=http://localhost:3000

# 2. Pa11y CI
pa11y-ci http://localhost:3000 http://localhost:3000/admin
```

---

## Reporting Issues

### Issue Template

```markdown
**Issue:** [Brief description]
**Severity:** [Critical/High/Medium/Low]
**Component:** [File path]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**
**Actual Behavior:**
**Screen Reader:** [VoiceOver/NVDA/JAWS]
**Browser:** [Chrome/Firefox/Safari + version]
**Screenshot/Video:** [If applicable]
```

### Priority Levels

- **Critical:** Blocks user from completing tasks
- **High:** Significantly impacts accessibility
- **Medium:** Noticeable but has workarounds
- **Low:** Minor enhancement

---

## Quick Reference: Testing Commands

```bash
# Check for missing alt text
grep -r "<img" app/ components/ --include="*.tsx" | grep -v "alt="

# Check for button without accessible name
grep -r "<button" app/ components/ --include="*.tsx" | grep -v "aria-label" | grep -v ">.*<"

# Find inputs without labels
grep -r "<input" app/ components/ --include="*.tsx" -A 2 | grep -v "label"

# Check lang attribute at runtime (browser console)
document.documentElement.lang

# Count focusable elements on page (browser console)
document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').length
```

---

## Resources

### WCAG Guidelines
- [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_overview&levels=aaa)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)

### Documentation
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Lead | | | |
| Accessibility Specialist | | | |
| Product Owner | | | |

---

**Document Version:** 1.0  
**Last Updated:** 2026-10-07  
**Next Review:** After Phase 2 implementation
