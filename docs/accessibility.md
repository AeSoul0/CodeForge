## `docs/accessibility.md`

````md
# CodeForge Accessibility

## 1. Purpose

Accessibility is treated as a core engineering requirement in CodeForge.

The objective is to ensure that the application remains usable across:

- keyboard navigation;
- assistive technologies;
- reduced-motion preferences;
- different viewport sizes;
- users with visual or motor accessibility needs.

This document separates implemented accessibility controls from measured
evidence.

---

# 2. Accessibility Baseline

Latest production Lighthouse result:

```text
Accessibility: 100/100
````

Latest Playwright accessibility scenarios:

```text
PASS
```

These results provide strong automated evidence for the current frontend
implementation.

They do not constitute an unconditional claim of full WCAG 2.2 AA compliance.

---

# 3. Semantic HTML

The frontend uses semantic HTML elements where appropriate:

```text
header
nav
main
section
footer
h1
h2
h3
a
button
form
label
```

The goal is to provide meaningful document structure instead of relying on
generic containers for semantic purposes.

---

# 4. Heading Hierarchy

Pages should maintain a logical heading hierarchy:

```text
h1
 ├── h2
 │    ├── h3
 │    └── h3
 └── h2
```

Heading levels should not be selected purely for visual sizing.

Visual presentation should remain a CSS responsibility.

---

# 5. Landmarks

Important application regions use semantic landmarks.

Examples include:

```text
navigation
main content
footer
sections
```

This allows assistive technologies to navigate the application more
efficiently.

---

# 6. Keyboard Navigation

Interactive elements are designed to be keyboard accessible.

The expected navigation model includes:

```text
Tab
Shift + Tab
Enter
Space
Escape
```

where appropriate for the interaction.

The application avoids making ordinary interactive behavior dependent exclusively
on pointer events.

---

# 7. Focus Visibility

CodeForge uses a visible `:focus-visible` indicator.

Current visual strategy:

```css
:focus-visible {
    outline: 2px solid #22d3ee;
    outline-offset: 2px;
}
```

The purpose is to ensure that users navigating with a keyboard can identify the
current interactive element.

Focus should not be removed without providing an equally visible replacement.

---

# 8. Skip Navigation

The frontend includes skip-navigation support.

The purpose is to allow keyboard and assistive-technology users to move
directly to the primary content without traversing every navigation element.

---

# 9. Forms

Forms should provide:

* explicit labels;
* meaningful input names;
* appropriate autocomplete attributes;
* clear validation messages;
* keyboard accessibility;
* understandable error states.

The authentication form is covered by the Playwright E2E suite.

---

# 10. Accessible Names

Interactive elements should have accessible names.

The implementation follows the principle:

```text
button/link/control
        ↓
meaningful accessible name
        ↓
assistive technology
```

Decorative icons are hidden from the accessibility tree where appropriate.

---

# 11. Images

Images should provide appropriate alternative text.

Decorative images should not create unnecessary screen-reader output.

The production Lighthouse audit currently passes the relevant image accessibility
checks.

---

# 12. Links and Buttons

Links are used for navigation.

Buttons are used for actions.

The application should avoid implementing interactive controls exclusively as
generic `div` elements.

This ensures expected browser and assistive-technology interaction behavior.

---

# 13. Color Contrast

The visual system uses a dark interface with high-contrast foreground text.

The latest Lighthouse accessibility measurement:

```text
100/100
```

supports the current automated contrast checks.

Contrast should still be reviewed when introducing new design tokens or colors.

---

# 14. Motion

The application supports:

```text
prefers-reduced-motion
```

The decorative particle system reduces or disables animation when users request
reduced motion.

Major interface animations should follow the same principle.

Animation must never be required to understand or operate the application.

---

# 15. Loading States

Dynamic UI should communicate loading states without causing accessibility
confusion.

Loading indicators should:

* have meaningful accessible text where necessary;
* not trap keyboard focus;
* avoid unnecessary motion;
* preserve layout where possible.

---

# 16. Error States

Errors should be understandable and actionable.

Examples:

```text
Session expired
Network unavailable
Validation failed
Server error
Resource not found
```

Error messages should be associated with the relevant form or content region
where appropriate.

---

# 17. Authentication Accessibility

The admin login flow supports:

* keyboard navigation;
* labeled username input;
* labeled password input;
* visible focus;
* browser autocomplete semantics;
* invalid-login feedback.

The login page is covered by Playwright.

---

# 18. Keyboard E2E Evidence

Playwright includes keyboard accessibility coverage.

Latest E2E execution:

```text
Running 12 tests using 6 workers
12 passed
```

The suite includes keyboard navigation scenarios.

---

# 19. Automated Accessibility Evidence

The accessibility suite uses axe-core through Playwright.

The tests validate the rendered application for automatically detectable
accessibility violations.

Current result:

```text
PASS
```

This provides regression protection against common accessibility defects.

---

# 20. Lighthouse Evidence

Latest production homepage:

| Category       |      Result |
| -------------- | ----------: |
| Accessibility  | **100/100** |
| Performance    |  **96/100** |
| Best Practices |  **96/100** |
| SEO            | **100/100** |

The accessibility result exceeds the roadmap target:

```text
Target: >= 90
Current: 100
```

---

# 21. Accessibility Regression Policy

A regression should be investigated when:

```text
Lighthouse Accessibility < 90
automated axe checks fail
keyboard navigation breaks
focus becomes invisible
form controls lose labels
critical content becomes inaccessible
reduced-motion behavior regresses
```

Accessibility changes should be validated with automated checks before merge.

---

# 22. Manual Review

Automated testing does not replace human accessibility evaluation.

A future manual accessibility review should cover:

```text
Keyboard-only navigation
Screen-reader navigation
Focus transitions
Modal/dialog behavior
Mobile touch interactions
Zoom / enlarged text
Error announcement behavior
```

The manual review should be documented separately rather than inferred from an
automated score.

---

# 23. Accessibility Checklist

## Structure

* [x] Semantic HTML
* [x] Main landmark
* [x] Navigation landmarks
* [x] Logical heading hierarchy
* [x] Skip navigation

## Keyboard

* [x] Keyboard-focusable controls
* [x] Visible focus
* [x] Logical tab order
* [x] Keyboard navigation tests

## Forms

* [x] Form labels
* [x] Accessible input names
* [x] Autocomplete support
* [x] Validation feedback

## Visual

* [x] Contrast checks
* [x] Visible focus indicator
* [x] Reduced-motion support
* [x] Accessible link/button names

## Automated

* [x] axe-core coverage
* [x] Lighthouse accessibility 100/100
* [x] Playwright accessibility tests

## Manual

* [ ] Screen-reader review
* [ ] Full keyboard-only manual review
* [ ] Mobile accessibility review

---

# 24. Current Accessibility Position

CodeForge currently has strong automated accessibility evidence:

```text
Lighthouse Accessibility: 100/100
Automated accessibility tests: PASS
Keyboard E2E: PASS
Reduced motion: Implemented
Visible focus: Implemented
Semantic structure: Implemented
```

The remaining work is manual validation rather than a known automated
accessibility failure.

---

# 25. Engineering Principle

Accessibility should remain part of feature development rather than a final
testing phase.

Every new interactive component should consider:

```text
Semantics
Keyboard behavior
Focus behavior
Accessible name
Error state
Reduced motion
Contrast
Screen-reader behavior
```

The goal is to preserve the current `100/100` automated accessibility baseline
as the application evolves.

```
```
