# Linear Design System - Comprehensive Analysis

**Analysis Date:** 2026-01-13
**Source:** linear.app (marketing site, login page, and features pages)
**Methodology:** Browser automation with computed CSS extraction

---

## Executive Summary

Linear employs a sophisticated dark-mode-first design system built on subtle elevations, meticulous attention to color depth (5+ levels), and premium typography. Their system prioritizes visual clarity through strategic use of semi-transparent borders, layered shadows, and a carefully crafted color palette that creates depth without harsh contrasts.

---

## Color Depth System

Linear uses a **7-tier background elevation system** for creating visual hierarchy:

### Background Levels (Darkest → Lightest)
```css
--color-bg-level-0: #08090a     /* Deepest background - main canvas */
--color-bg-level-1: #0f1011     /* Slightly elevated surfaces */
--color-bg-level-2: #141516     /* Card/panel backgrounds */
--color-bg-level-3: #191a1b     /* Hover states, elevated cards */
--color-bg-secondary: #1c1c1f   /* Secondary surfaces */
--color-bg-tertiary: #232326    /* Tertiary surfaces */
--color-bg-quaternary: #28282c  /* Elevated elements */
--color-bg-quinary: #282828     /* Highest elevation */
```

### Semantic Background Colors
```css
--color-bg-primary: #08090a           /* Primary background */
--color-bg-marketing: #010102         /* Marketing pages */
--color-bg-translucent: rgba(255,255,255,.05)  /* Overlays */
--color-bg-tint: #141516              /* Tinted surfaces */
--color-accent-tint: #18182f          /* Accent-tinted */
```

### Text Color Hierarchy (5 levels)
```css
--color-text-primary: #f7f8f8   /* Main text - nearly white */
--color-text-secondary: #d0d6e0 /* Headings, emphasis */
--color-text-tertiary: #8a8f98  /* Secondary text */
--color-text-quaternary: #62666d /* Disabled, subtle */
```

### Foreground Colors
```css
--color-fg-primary: #f7f8f8
--color-fg-secondary: #d0d6e0
--color-fg-tertiary: #8a8f98
--color-fg-quaternary: #62666d
```

### Border System (4 tiers)
```css
--color-border-primary: #23252a     /* Main borders */
--color-border-secondary: #34343a   /* Secondary borders */
--color-border-tertiary: #3e3e44    /* Tertiary borders */
--color-border-translucent: rgba(255,255,255,.05)  /* Subtle dividers */
```

### Line/Divider Colors (4 tiers)
```css
--color-line-primary: #37393a      /* Primary dividers */
--color-line-secondary: #202122    /* Secondary dividers */
--color-line-tertiary: #18191a     /* Tertiary dividers */
--color-line-quaternary: #141515   /* Subtlest dividers */
--color-line-tint: #141516         /* Tinted lines */
```

### Accent Colors
```css
--color-accent: #7170ff           /* Primary accent (purple) */
--color-accent-hover: #828fff     /* Hover state */
--color-brand-bg: #5e6ad2         /* Brand background (indigo) */
--color-indigo: #5e6ad2           /* Indigo */
--color-link-primary: #828fff     /* Links */
--color-link-hover: #fff          /* Link hover */
```

### Functional Colors
```css
--color-red: #eb5757              /* Error, destructive */
--color-orange: #fc7840           /* Warning */
--color-yellow: #f2c94c           /* Caution */
--color-green: #4cb782            /* Success */
--color-blue: #4ea7fc             /* Info */

/* Linear-specific */
--color-linear-plan: #68cc58      /* Planning (green) */
--color-linear-build: #d4b144     /* Building (gold) */
--color-linear-security: #7a7fad  /* Security (purple) */
```

---

## Border Treatments

Linear uses **semi-transparent borders** as their primary elevation technique:

### Border Opacity Levels
```css
/* 5% transparency - most subtle */
rgba(255,255,255,.05)

/* 8% transparency - standard borders */
rgba(255,255,255,.08)  /* Header borders */

/* Solid borders for defined elements */
--color-border-primary: #23252a
--color-border-secondary: #34343a
```

### Border Width
```css
--border-hairline: .5px  /* Ultra-thin borders */
```

### Header Border Treatment
```css
--header-border: rgba(255,255,255,.08)  /* 8% white overlay */
```

**Key Insight:** Linear avoids solid black borders. They use:
- Semi-transparent white overlays (5-8% opacity)
- Very thin lines (0.5px)
- Color-mixed borders for subtle differentiation
- No gradients on borders - keeps them clean

---

## Shadow System

Linear uses **5 shadow elevation levels** with stacked shadows for depth:

### Shadow Levels
```css
--shadow-none: 0px 0px 0px transparent
--shadow-tiny: 0px 0px 0px transparent
--shadow-low: 0px 2px 4px rgba(0,0,0,.1)
--shadow-medium: 0px 4px 24px rgba(0,0,0,.2)
--shadow-high: 0px 7px 32px rgba(0,0,0,.35)
```

### Advanced Stacked Shadow
```css
--shadow-stack-low:
  0px 8px 2px 0px transparent,
  0px 5px 2px 0px rgba(0,0,0,.01),
  0px 3px 2px 0px rgba(0,0,0,.04),
  0px 1px 1px 0px rgba(0,0,0,.07),
  0px 0px 1px 0px rgba(0,0,0,.08)
```

**Key Pattern:** Shadows increase in both spread and opacity:
- Low: 2px blur, 10% opacity
- Medium: 4px blur, 24px spread, 20% opacity
- High: 7px blur, 32px spread, 35% opacity

---

## Typography Hierarchy

### Font Family
```css
/* Primary: Inter Variable */
--font-regular: "Inter Variable", "SF Pro Display", -apple-system,
                BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
                "Ubuntu", "Cantarell", "Open Sans", "Helvetica Neue", sans-serif

/* Display: Tiempos Headline */
--font-serif-display: "Tiempos Headline", ui-serif, Georgia,
                       Cambria, "Times New Roman", Times, serif

/* Monospace: Berkeley Mono */
--font-monospace: "Berkeley Mono", ui-monospace, "SF Mono", "Menlo", monospace
```

### Font Weights (6 levels)
```css
--font-weight-light: 300
--font-weight-normal: 400
--font-weight-medium: 510
--font-weight-semibold: 590
--font-weight-bold: 680
```

**Note:** Uses variable font with specific weights (510, 590, 680) instead of standard 400/500/600/700

### Title Scale (9 levels)

| Level | Size | Weight | Line Height | Letter Spacing |
|-------|------|--------|-------------|----------------|
| Title 1 | 1.0625rem (17px) | 590 | 1.4 | -0.012em |
| Title 2 | 1.3125rem (21px) | 590 | 1.33 | -0.012em |
| Title 3 | 1.5rem (24px) | 590 | 1.33 | -0.012em |
| Title 4 | 2rem (32px) | 590 | 1.125 | -0.022em |
| Title 5 | 2.5rem (40px) | 590 | 1.1 | -0.022em |
| Title 6 | 3rem (48px) | 590 | 1.1 | -0.022em |
| Title 7 | 3.5rem (56px) | 590 | 1.1 | -0.022em |
| Title 8 | 4rem (64px) | 590 | 1.06 | -0.022em |
| Title 9 | 4.5rem (72px) | 590 | 1 | -0.022em |

### Text Scale (6 levels)

| Level | Size | Line Height | Letter Spacing |
|-------|------|-------------|----------------|
| Tiny | 0.625rem (10px) | 1.5 | -0.015em |
| Micro | 0.75rem (12px) | 1.4 | 0 |
| Mini | 0.8125rem (13px) | 1.5 | -0.01em |
| Small | 0.875rem (14px) | calc(21/14) | -0.013em |
| Regular | 0.9375rem (15px) | 1.6 | -0.011em |
| Large | 1.0625rem (17px) | 1.6 | 0 |

**Key Typography Patterns:**
- Negative letter-spacing on larger titles (-0.012em to -0.022em)
- Tighter line-height on larger titles (1.06 to 1.1)
- Generous line-height on body text (1.5 to 1.6)
- Variable font enables precise weight selection

---

## Component Elevation

### Border Radius (8 levels)
```css
--radius-4: 4px     /* Small elements, tags */
--radius-6: 6px     /* Buttons, inputs */
--radius-8: 8px     /* Cards, standard elements */
--radius-12: 12px   /* Large cards */
--radius-16: 16px   /* Modals, panels */
--radius-24: 24px   /* Large modals */
--radius-32: 32px   /* Hero elements */
--radius-circle: 50%
--radius-rounded: 9999px  /* Pills, badges */
```

### Layer/Z-Index System (13 levels)
```css
--layer-scrollbar: 75
--layer-footer: 50
--layer-header: 100
--layer-1: 1
--layer-2: 2
--layer-3: 3
--layer-overlay: 500
--layer-popover: 600
--layer-command-menu: 650
--layer-dialog: 700
--layer-dialog-overlay: 699
--layer-toasts: 800
--layer-tooltip: 1100
--layer-context-menu: 1200
--layer-skip-nav: 5000
--layer-debug: 5100
--layer-max: 10000
```

---

## Spacing System

### Layout Spacing
```css
--page-padding-inline: 24px      /* Horizontal page padding */
--page-padding-block: 64px       /* Vertical page padding */
--page-max-width: 1024px         /* Content max width */
--prose-max-width: 624px         /* Text content max width */
```

### Header
```css
--header-height: 64px
--header-bg: rgba(11,11,11,.8)   /* 80% black */
--header-blur: 20px              /* Backdrop blur */
--header-border: rgba(255,255,255,.08)
```

### Interactive Targets
```css
--min-tap-size: 44px             /* Minimum touch target */
```

### Grid
```css
--grid-columns: 12
```

---

## Subtle Visual Effects

### Scrollbar Styling
```css
--scrollbar-size: 6px
--scrollbar-size-active: 10px
--scrollbar-color: rgba(255,255,255,.1)
--scrollbar-color-hover: rgba(255,255,255,.2)
--scrollbar-color-active: rgba(255,255,255,.4)
--scrollbar-gap: 4px
```

### Focus States
```css
--focus-ring-width: 2px
--focus-ring-offset: 2px
--focus-ring-color: #5e6ad2
--focus-ring-outline: 2px solid #5e6ad2
```

### Selection
```css
--color-selection-bg: color-mix(in lch, #5e6ad2, black 10%)
--color-selection-text: #fff
--color-selection-dim: color-mix(in lch, #5e6ad2, transparent 80%)
```

### Overlays
```css
--color-overlay-primary: rgba(0,0,0,.9)
--color-overlay-dim-rgb: 255,255,255
```

### Masks
```css
--mask-on: black
--mask-off: transparent
--mask-visible: black
--mask-invisible: transparent
--mask-ease: rgba(0,0,0,.2)
```

---

## Animation System

### Transition Speeds (4 levels)
```css
--speed-highlightFadeIn: 0s
--speed-highlightFadeOut: .15s
--speed-quickTransition: .1s
--speed-regularTransition: .25s
```

### Easing Functions (20+ curves)

#### Ease Out (Deceleration)
```css
--ease-out-quad: cubic-bezier(.25,.46,.45,.94)
--ease-out-cubic: cubic-bezier(.215,.61,.355,1)
--ease-out-quart: cubic-bezier(.165,.84,.44,1)
--ease-out-quint: cubic-bezier(.23,1,.32,1)
--ease-out-expo: cubic-bezier(.19,1,.22,1)
--ease-out-circ: cubic-bezier(.075,.82,.165,1)
```

#### Ease In (Acceleration)
```css
--ease-in-quad: cubic-bezier(.55,.085,.68,.53)
--ease-in-cubic: cubic-bezier(.55,.055,.675,.19)
--ease-in-quart: cubic-bezier(.895,.03,.685,.22)
--ease-in-quint: cubic-bezier(.755,.05,.855,.06)
--ease-in-expo: cubic-bezier(.95,.05,.795,.035)
--ease-in-circ: cubic-bezier(.6,.04,.98,.335)
```

#### Ease In-Out (Acceleration then Deceleration)
```css
--ease-in-out-quad: cubic-bezier(.455,.03,.515,.955)
--ease-in-out-cubic: cubic-bezier(.645,.045,.355,1)
--ease-in-out-quart: cubic-bezier(.77,0,.175,1)
--ease-in-out-quint: cubic-bezier(.86,0,.07,1)
--ease-in-out-expo: cubic-bezier(1,0,0,1)
--ease-in-out-circ: cubic-bezier(.785,.135,.15,.86)
```

**Animation Philosophy:** Linear prefers ease-out curves (deceleration) for natural-feeling interactions, with quick transitions (0.1s) for responsive feedback.

---

## Practical Implementation Guide

### Creating Elevated Cards
```css
.card {
  background: var(--color-bg-level-2);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-8);
  box-shadow: var(--shadow-low);
}

.card:hover {
  background: var(--color-bg-level-3);
  border-color: var(--color-border-secondary);
  box-shadow: var(--shadow-medium);
}
```

### Typography Hierarchy
```css
h1 {
  font: var(--title-2);
  color: var(--color-text-primary);
}

body {
  font: var(--text-regular);
  color: var(--color-text-secondary);
}

.secondary-text {
  color: var(--color-text-tertiary);
}
```

### Subtle Borders
```css
.divider {
  border-top: 1px solid var(--color-border-translucent);
  /* OR */
  border-top: var(--border-hairline) solid var(--color-line-primary);
}
```

### Focus States
```css
:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}
```

---

## Key Design Principles

1. **Dark-First Design:** All base colors are dark variants, with white as text
2. **Subtle Elevation:** Uses semi-transparent borders (5-8% white) rather than solid lines
3. **Depth Through Layers:** 7-level background system creates clear hierarchy
4. **Premium Typography:** Variable font with precise weights (510, 590, 680)
5. **Tight Letter-Spacing:** Negative spacing on large titles (-0.012em to -0.022em)
6. **Sophisticated Shadows:** Stacked shadows for realistic depth
7. **Smooth Animations:** Prefers ease-out curves with quick transitions
8. **Attention to Detail:** 0.5px borders, backdrop blur, custom scrollbar styling

---

## Screenshots Reference

- **Landing Page:** `/Users/michaeldurante/ai dev/ce-hub/.playwright-mcp/.linear-landing-page.png`
- **Login Page:** `/Users/michaeldurante/ai dev/ce-hub/.playwright-mcp/.linear-login-page.png`
- **Features Page:** `/Users/michaeldurante/ai dev/ce-hub/.playwright-mcp/.linear-features-page.png`

---

## Implementation Checklist

When implementing a Linear-inspired design system:

- [ ] Set up 7-level background color system
- [ ] Implement semi-transparent borders (5% and 8% white)
- [ ] Use Inter Variable font with weights 400/510/590/680
- [ ] Apply negative letter-spacing to headings
- [ ] Create 5-level shadow system
- [ ] Set up 9-level title scale
- [ ] Implement 6-level text scale
- [ ] Use backdrop blur on headers (20px)
- [ ] Add focus rings with 2px offset
- [ ] Style scrollbars with 6px width and 10% white
- [ ] Set up z-index layer system
- [ ] Use ease-out cubic for transitions
- [ ] Keep transitions quick (0.1s to 0.25s)

---

## Color Palette Summary (Ready to Use)

```css
:root {
  /* Backgrounds */
  --bg-0: #08090a;
  --bg-1: #0f1011;
  --bg-2: #141516;
  --bg-3: #191a1b;
  --bg-4: #1c1c1f;
  --bg-5: #232326;

  /* Text */
  --text-primary: #f7f8f8;
  --text-secondary: #d0d6e0;
  --text-tertiary: #8a8f98;
  --text-quaternary: #62666d;

  /* Borders */
  --border-1: #23252a;
  --border-2: #34343a;
  --border-3: #3e3e44;
  --border-subtle: rgba(255,255,255,.05);

  /* Accents */
  --accent: #7170ff;
  --accent-hover: #828fff;
  --brand: #5e6ad2;

  /* Shadows */
  --shadow-1: 0px 2px 4px rgba(0,0,0,.1);
  --shadow-2: 0px 4px 24px rgba(0,0,0,.2);
  --shadow-3: 0px 7px 32px rgba(0,0,0,.35);

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* Typography */
  --font-sans: "Inter Variable", -apple-system, sans-serif;
  --font-mono: "Berkeley Mono", ui-monospace, monospace;
}
```

---

**End of Analysis**

This comprehensive breakdown provides all CSS values needed to replicate Linear's sophisticated dark-mode design system. Focus on the semi-transparent borders, multi-level backgrounds, and precise typography for the most authentic Linear look.
