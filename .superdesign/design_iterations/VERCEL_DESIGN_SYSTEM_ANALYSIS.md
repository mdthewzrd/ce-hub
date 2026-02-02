# Vercel Geist Design System - Complete Analysis & Implementation Guide

## Executive Summary

This document provides a comprehensive breakdown of Vercel's Geist design system based on official documentation from vercel.com/design and vercel.com/geist. It includes exact CSS values, implementation patterns, and design tokens you can implement directly.

## Sources

- [Vercel Design System](https://vercel.com/design)
- [Geist Color System](https://vercel.com/geist/colors)
- [Geist UI Documentation](https://geist-ui.dev/en-us/guide/colors)
- [Web Interface Guidelines](https://vercel.com/design/guidelines)

---

## 1. COLOR SYSTEM

### Dark Mode Color Scale (Complete)

Vercel uses a 10-color scale for gray tones, plus status colors:

#### Background Colors
```css
--geist-background: #000000;        /* Main background */
--geist-background-2: #111111;      /* Secondary background */
```

#### Component Backgrounds (Colors 1-3)
Used for UI component backgrounds with varying contrast:

```css
--geist-color-1: #111111;           /* Default component background */
--geist-color-2: #333333;           /* Hover background */
--geist-color-3: #444444;           /* Active/pressed background */
```

**Usage Pattern:**
- If component uses Background 1 as default
- Use Color 1 for hover state
- Use Color 2 for active/pressed state
- On smaller UI elements like badges, use Color 2 or 3 as background

#### Border Colors (Colors 4-6)
Used for UI component borders:

```css
--geist-color-4: #333333;           /* Subtle border */
--geist-color-5: #444444;           /* Medium border */
--geist-color-6: #666666;           /* Strong border */
```

**Usage Pattern:**
- Color 4: Default borders, subtle separation
- Color 5: More prominent borders
- Color 6: High-emphasis borders

#### High Contrast Backgrounds (Colors 7-8)

```css
--geist-color-7: #eaeaea;           /* High contrast background */
--geist-color-8: #fafafa;           /* Hover high contrast */
```

**Usage Pattern:**
- Color 7: High contrast element backgrounds
- Color 8: Hover state for high contrast elements

#### Text & Icons (Colors 9-10)

```css
--geist-color-9: #888888;           /* Secondary text/icons */
--geist-color-10: #fafafa;          /* Primary text/icons */
```

**Usage Pattern:**
- Color 9: Secondary text, descriptions, muted content
- Color 10: Primary text, headings, body copy

### Status Colors

#### Success (Blue)
```css
--geist-success: #0070f3;           /* Default */
--geist-success-light: #3291ff;     /* Light variant */
--geist-success-lighter: #d3e5ff;   /* Lighter background */
--geist-success-dark: #0761d1;      /* Dark variant */
```

#### Error (Red)
```css
--geist-error: #e00;                /* Default */
--geist-error-light: #ff1a1a;       /* Light variant */
--geist-error-lighter: #f7d4d6;     /* Lighter background */
--geist-error-dark: #c50000;        /* Dark variant */
```

#### Warning (Orange)
```css
--geist-warning: #f5a623;           /* Default */
--geist-warning-light: #f7b955;     /* Light variant */
--geist-warning-lighter: #ffefcf;   /* Lighter background */
--geist-warning-dark: #ab570a;      /* Dark variant */
```

#### Cyan
```css
--geist-cyan: #50e3c2;              /* Default */
--geist-cyan-light: #79ffe1;        /* Light variant */
--geist-cyan-lighter: #aaffec;      /* Lighter background */
--geist-cyan-dark: #29bc9b;         /* Dark variant */
```

#### Violet
```css
--geist-violet: #7928ca;            /* Default */
--geist-violet-light: #8a63d2;      /* Light variant */
--geist-violet-lighter: #e3d7fc;    /* Lighter background */
--geist-violet-dark: #4c2889;       /* Dark variant */
```

#### Highlight Colors
```css
--geist-alert: #ff0080;             /* Alert/Magenta */
--geist-purple: #f81ce5;            /* Purple accent */
--geist-magenta: #eb367f;           /* Magenta accent */
```

---

## 2. DEPTH & ELEVATION

### Border Treatments

Vercel creates depth through **layered opacity** and **crisp borders**:

#### Border Opacity Levels (Dark Mode)
```css
/* For light-on-dark backgrounds */
--border-opacity-1: rgba(255, 255, 255, 0.05);    /* Subtle */
--border-opacity-2: rgba(255, 255, 255, 0.1);     /* Default */
--border-opacity-3: rgba(255, 255, 255, 0.15);    /* Medium */
--border-opacity-4: rgba(255, 255, 255, 0.2);     /* Strong */
```

#### Border Widths
```css
--geist-border-width-hairline: 1px;
--geist-border-width-thin: 1px;
--geist-border-width-medium: 2px;
--geist-border-width-thick: 3px;
```

#### Implementation Pattern
```css
/* Vercel's crisp border pattern */
.card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4),
              0 0 0 1px rgba(255, 255, 255, 0.05);
}
```

**Key Principle:** Combine borders with shadows. Semi-transparent borders improve edge clarity, especially in dark mode.

### Shadow System

Vercel uses **layered shadows** to mimic ambient + direct light:

#### Light Mode Shadows
```css
/* Small - Elevation for cards, buttons */
--shadow-small:
  0 2px 4px rgba(0, 0, 0, 0.05),   /* Ambient */
  0 1px 2px rgba(0, 0, 0, 0.1);    /* Direct */

/* Base - Default elevation */
--shadow-base:
  0 4px 8px rgba(0, 0, 0, 0.05),
  0 2px 4px rgba(0, 0, 0, 0.1);

/* Medium - Dropdowns, popovers */
--shadow-medium:
  0 8px 16px rgba(0, 0, 0, 0.08),
  0 4px 8px rgba(0, 0, 0, 0.1);

/* Large - Modals, panels */
--shadow-large:
  0 16px 32px rgba(0, 0, 0, 0.08),
  0 8px 16px rgba(0, 0, 0, 0.1);

/* XL - Highest elevation */
--shadow-xl:
  0 24px 48px rgba(0, 0, 0, 0.12),
  0 12px 24px rgba(0, 0, 0, 0.15);
```

#### Dark Mode Shadows
In dark mode, shadows are more subtle and use a **glow effect**:

```css
/* Small */
--shadow-small-dark:
  0 2px 4px rgba(0, 0, 0, 0.3),
  0 0 0 1px rgba(255, 255, 255, 0.05);  /* Subtle glow */

/* Base */
--shadow-base-dark:
  0 4px 8px rgba(0, 0, 0, 0.4),
  0 0 0 1px rgba(255, 255, 255, 0.05);

/* Medium */
--shadow-medium-dark:
  0 8px 16px rgba(0, 0, 0, 0.5),
  0 0 0 1px rgba(255, 255, 255, 0.08);

/* Large */
--shadow-large-dark:
  0 16px 32px rgba(0, 0, 0, 0.6),
  0 0 0 1px rgba(255, 255, 255, 0.1);
```

**Key Principles:**
1. Always use **at least 2 shadow layers**
2. First layer: ambient light (subtle)
3. Second layer: direct light (more visible)
4. Dark mode: Add subtle white border for glow effect

---

## 3. BORDER RADIUS

```css
--geist-radius-sm: 3px;     /* Small elements: badges, tags */
--geist-radius-base: 5px;   /* Default: buttons, inputs */
--geist-radius-md: 8px;     /* Cards, panels */
--geist-radius-lg: 12px;    /* Large cards, modals */
--geist-radius-xl: 16px;    /* Hero sections, banners */
```

### Nested Radii Pattern
From Vercel's guidelines: **Child radius ≤ parent radius & concentric**

```css
.parent-card {
  border-radius: 12px;
}

.child-element {
  border-radius: 8px;  /* Must be ≤ parent */
}
```

---

## 4. TYPOGRAPHY SCALE

### Font Family
```css
/* Sans-serif - Inter */
--geist-font-family: 'Inter', -apple-system, BlinkMacSystemFont,
  'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
  'Helvetica Neue', sans-serif;

/* Monospace - Geist Mono */
--geist-font-mono: 'Geist Mono', 'SF Mono', Monaco, 'Cascadia Code',
  'Roboto Mono', Consolas, 'Courier New', monospace;
```

### Font Sizes (Modular Scale: 1.125)

Vercel uses a **Major Second** scale (1.125 ratio):

```css
--geist-font-size-xs: 0.75rem;      /* 12px - Small text */
--geist-font-size-sm: 0.875rem;     /* 14px - Labels, captions */
--geist-font-size-base: 1rem;       /* 16px - Body text */
--geist-font-size-md: 1.125rem;     /* 18px - Subheadings */
--geist-font-size-lg: 1.25rem;      /* 20px - Emphasized text */
--geist-font-size-xl: 1.5rem;       /* 24px - Section headings */
--geist-font-size-2xl: 1.875rem;    /* 30px - Page headings */
--geist-font-size-3xl: 2.25rem;     /* 36px - Large titles */
--geist-font-size-4xl: 3rem;        /* 48px - Hero text */
```

### Font Weights
```css
--geist-font-weight-normal: 400;    /* Body text */
--geist-font-weight-medium: 500;    /* Buttons, labels */
--geist-font-weight-semibold: 600;  /* Headings, emphasis */
--geist-font-weight-bold: 700;      /* Strong emphasis */
```

### Line Heights
```css
--geist-leading-tight: 1.25;        /* Headings */
--geist-leading-normal: 1.5;        /* Body text */
--geist-leading-relaxed: 1.75;      /* Relaxed text */
```

### Letter Spacing
```css
--geist-tracking-tight: -0.025em;   /* Headings (-0.32px) */
--geist-tracking-normal: 0;         /* Body text */
--geist-tracking-wide: 0.025em;     /* All caps, labels */
```

### Tabular Numbers
For numeric data and comparisons, use monospace with tabular figures:

```css
.numeric-data {
  font-family: var(--geist-font-mono);
  font-variant-numeric: tabular-nums;
}
```

---

## 5. SPACING SYSTEM

Vercel uses a **4px base unit** scale:

```css
--geist-space-0: 0;
--geist-space-1: 0.25rem;    /* 4px */
--geist-space-2: 0.5rem;     /* 8px */
--geist-space-3: 0.75rem;    /* 12px */
--geist-space-4: 1rem;       /* 16px - Base spacing */
--geist-space-5: 1.25rem;    /* 20px */
--geist-space-6: 1.5rem;     /* 24px */
--geist-space-8: 2rem;       /* 32px */
--geist-space-10: 2.5rem;    /* 40px */
--geist-space-12: 3rem;      /* 48px */
--geist-space-16: 4rem;      /* 64px */
--geist-space-20: 5rem;      /* 80px */
--geist-space-24: 6rem;      /* 96px */
```

**Usage Pattern:**
- Prefer even numbers
- Use 4px as the smallest unit
- Consistent padding: 16px (1rem) for cards, 24px (1.5rem) for sections

---

## 6. TRANSITIONS & ANIMATIONS

### Easing Functions
```css
--geist-ease-linear: linear;
--geist-ease-in: cubic-bezier(0.4, 0, 1, 1);
--geist-ease-out: cubic-bezier(0, 0, 0.2, 1);      /* Most common */
--geist-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Durations
```css
--geist-duration-instant: 100ms;
--geist-duration-fast: 150ms;
--geist-duration-normal: 200ms;      /* Default */
--geist-duration-slow: 300ms;
--geist-duration-slower: 500ms;
```

### Default Transition
```css
--geist-transition-default:
  200ms cubic-bezier(0, 0, 0.2, 1);
```

### Animation Principles (from Vercel's guidelines)

1. **Honor `prefers-reduced-motion`**
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

2. **Compositor-friendly properties**
   - Prefer: `transform`, `opacity`
   - Avoid: `width`, `height`, `top`, `left`

3. **Never `transition: all`**
   ```css
   /* Bad */
   transition: all 200ms ease-out;

   /* Good - Explicit properties */
   transition: opacity 200ms ease-out,
               transform 200ms ease-out;
   ```

4. **Interruptible animations**
   - Animations should be cancelable by user input
   - Avoid autoplay; animate in response to actions

---

## 7. Z-INDEX SCALE

```css
--geist-z-base: 0;              /* Default flow */
--geist-z-dropdown: 100;        /* Dropdowns */
--geist-z-sticky: 200;          /* Sticky headers */
--geist-z-fixed: 300;           /* Fixed navigation */
--geist-z-modal-backdrop: 400;  /* Modal overlay */
--geist-z-modal: 500;           /* Modal content */
--geist-z-popover: 600;         /* Popovers, tooltips */
--geist-z-tooltip: 700;         /* Tooltips */
```

---

## 8. IMPLEMENTATION PATTERNS

### Card Component
```css
.card {
  background: var(--geist-background);
  border: 1px solid var(--geist-color-4);
  border-radius: var(--geist-radius-lg);
  box-shadow: var(--shadow-base);
  padding: var(--geist-space-6);
  transition: box-shadow var(--geist-transition-default);
}

.card:hover {
  box-shadow: var(--shadow-medium);
}

.dark .card {
  background: var(--geist-background-dark);
  border-color: var(--geist-color-4-dark);
  box-shadow: var(--shadow-base-dark);
}
```

### Button Component
```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--geist-space-2) var(--geist-space-4);
  font-size: var(--geist-font-size-sm);
  font-weight: var(--geist-font-weight-medium);
  line-height: var(--geist-leading-tight);
  border-radius: var(--geist-radius-base);
  border: 1px solid var(--geist-color-4);
  background: var(--geist-background);
  color: var(--geist-color-10);
  cursor: pointer;
  transition: all var(--geist-transition-default);
  min-height: 44px; /* Mobile touch target */
}

.button:hover {
  background: var(--geist-color-2);
}

.button:active {
  background: var(--geist-color-3);
}

.button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.3);
}
```

### Input Component
```css
.input {
  width: 100%;
  padding: var(--geist-space-2) var(--geist-space-3);
  font-size: var(--geist-font-size-base); /* ≥16px prevents iOS zoom */
  font-family: var(--geist-font-family);
  line-height: var(--geist-leading-normal);
  color: var(--geist-color-10);
  background: var(--geist-background);
  border: 1px solid var(--geist-color-4);
  border-radius: var(--geist-radius-base);
  transition: border-color var(--geist-transition-default),
              box-shadow var(--geist-transition-default);
}

.input:focus {
  outline: none;
  border-color: var(--geist-success);
  box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.3);
}

.input::placeholder {
  color: var(--geist-color-9);
}
```

---

## 9. ACCESSIBILITY REQUIREMENTS

From Vercel's Web Interface Guidelines:

### Focus Management
```css
/* Use focus-visible to avoid distracting pointer users */
*:focus-visible {
  outline: 2px solid var(--geist-success);
  outline-offset: 2px;
}

/* Or use Vercel's focus ring */
*:focus-visible {
  box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.3);
}
```

### Minimum Contrast
- Prefer **APCA** over WCAG 2 for more accurate perceptual contrast
- Interactions increase contrast: `:hover`, `:active`, `:focus` have more contrast than rest state

### Touch Targets
- Minimum: **44px** on mobile
- If visual target < 24px, expand hit target to ≥ 24px
- Use `touch-action: manipulation` to prevent double-tap zoom

### Keyboard Navigation
- All flows must be keyboard-operable
- Follow WAI-ARIA Authoring Patterns
- Use focus traps, move & return focus appropriately

### Loading States
- Add short show-delay (~150-300ms)
- Minimum visible time (~300-500ms) to avoid flicker

---

## 10. DESIGN PRINCIPLES

### From Vercel's Guidelines

#### Layered Shadows
- Mimic ambient + direct light with **at least 2 layers**
- First layer: Subtle, larger spread
- Second layer: More concentrated, smaller offset

#### Crisp Borders
- Combine borders & shadows
- Semi-transparent borders improve edge clarity
- In dark mode, use white borders with low opacity

#### Nested Radii
- Child radius ≤ parent radius
- Concentric curves must align
- Example: Parent 12px → Child 8px or less

#### Hue Consistency
- On non-neutral backgrounds, tint borders/shadows/text toward the same hue
- Creates visual harmony

#### Deliberate Alignment
- Every element aligns to grid, baseline, edge, or optical center
- No accidental positioning

#### Optical Alignment
- Adjust ±1px when perception beats geometry
- Fine-tune for visual balance

---

## 11. DARK MODE IMPLEMENTATION

### Method 1: Class-based (Recommended)
```css
/* Apply to html or body */
<html class="dark"> or <body class="dark">

.dark {
  --geist-background: #000000;
  --geist-color-10: #fafafa;
  /* Override all light mode variables */
}
```

### Method 2: Media Query
```css
@media (prefers-color-scheme: dark) {
  :root {
    --geist-background: #000000;
    --geist-color-10: #fafafa;
    /* Override all light mode variables */
  }
}
```

### Browser UI Matching
```css
/* Match browser theme to page background */
<meta name="theme-color" content="#000000">

/* Style scrollbars and device UI */
html {
  color-scheme: dark;
}
```

---

## 12. PERFORMANCE CONSIDERATIONS

### From Vercel's Guidelines

#### Font Optimization
```html
<!-- Preload critical fonts -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>

<!-- Subset fonts to needed glyphs -->
<!-- Use unicode-range -->
```

#### Image Optimization
- Set explicit dimensions to prevent CLS
- Lazy-load below-the-fold images
- Preload only above-the-fold images

#### Animation Performance
- Prefer CSS over JS
- Use GPU-accelerated properties: `transform`, `opacity`
- Avoid properties that trigger reflows: `width`, `height`, `top`, `left`

#### Reduce Layout Work
- Let CSS handle flow, wrapping, alignment
- Avoid measuring in JS
- Batch reads/writes

---

## 13. COMMON PATTERNS

### Gradient Fade (Northern Lights Effect)
Vercel uses a signature gradient fade effect:

```css
.gradient-fade {
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 0, 0, 0.1) 100%
  );
  pointer-events: none;
}
```

### Glassmorphism (Subtle)
```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Hover State Pattern
```css
.interactive {
  transition:
    background var(--geist-duration-fast) var(--geist-ease-out),
    transform var(--geist-duration-fast) var(--geist-ease-out);
}

.interactive:hover {
  background: var(--geist-color-2);
  transform: translateY(-1px);
}

.interactive:active {
  background: var(--geist-color-3);
  transform: translateY(0);
}
```

---

## 14. QUICK REFERENCE

### Common Color Combinations

#### Default Button
```css
background: var(--geist-background);
border: 1px solid var(--geist-color-4);
color: var(--geist-color-10);
```

#### Primary Button (Success Blue)
```css
background: var(--geist-success);
border-color: var(--geist-success);
color: white;
```

#### Error State
```css
background: var(--geist-error-lighter);
border-color: var(--geist-error);
color: var(--geist-error);
```

#### Disabled State
```css
background: var(--geist-color-1);
border-color: var(--geist-color-4);
color: var(--geist-color-9);
opacity: 0.6;
```

### Common Spacing Values
```css
/* Compact */
padding: var(--geist-space-2) var(--geist-space-3); /* 8px 12px */

/* Default */
padding: var(--geist-space-2) var(--geist-space-4); /* 8px 16px */

/* Comfortable */
padding: var(--geist-space-3) var(--geist-space-6); /* 12px 24px */
```

---

## 15. IMPLEMENTATION CHECKLIST

- [ ] Import Inter font family
- [ ] Set up CSS variables for colors
- [ ] Implement shadow system with layered approach
- [ ] Configure border opacity levels
- [ ] Set up typography scale
- [ ] Define spacing units
- [ ] Create transition utilities
- [ ] Implement focus rings for accessibility
- [ ] Add dark mode support
- [ ] Test with prefers-reduced-motion
- [ ] Verify touch targets ≥ 44px
- [ ] Check contrast ratios
- [ ] Test keyboard navigation
- [ ] Validate hover/focus states
- [ ] Optimize font loading
- [ ] Set explicit image dimensions

---

## 16. RESOURCES

### Official Documentation
- [Vercel Design](https://vercel.com/design)
- [Geist Colors](https://vercel.com/geist/colors)
- [Geist UI Themes](https://geist-ui.dev/en-us/guide/themes)
- [Geist UI Colors](https://geist-ui.dev/en-us/guide/colors)
- [Web Interface Guidelines](https://vercel.com/design/guidelines)

### Implementation Resources
- Complete CSS implementation: `.superdesign/design_iterations/vercel-design-system-complete.css`
- This analysis document
- Vercel's AGENTS.md for interface guidelines

---

## Conclusion

This analysis provides you with exact CSS values and implementation patterns from Vercel's Geist design system. The key differentiators are:

1. **Layered shadows** (ambient + direct light)
2. **Crisp borders** with semi-transparent opacity
3. **10-color gray scale** for precise depth control
4. **Inter font** with modular scale typography
5. **4px spacing base unit** system
6. **Accessibility-first** approach with clear guidelines

Use the provided CSS file directly in your project, and reference this document for implementation patterns and design decisions.

---

**Generated:** 2025-01-13
**Sources:** Vercel official design documentation
**Version:** Geist Design System (Current)
