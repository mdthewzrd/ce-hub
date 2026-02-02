# TRADERRA BRAND KIT & DESIGN SYSTEM
**Complete Style Guide for Uniform Cross-Platform Branding**

*Generated from localhost:6565 Traderra Frontend | Version 1.0*

---

## 🎨 **BRAND IDENTITY**

### Primary Brand Color
```css
/* Signature Traderra Gold */
--traderra-gold: #D4AF37;
--traderra-gold-dark: #B8860B;
--traderra-gold-light: hsl(45, 93%, 40%);

/* Usage: Primary buttons, accents, highlights, logo */
```

### Brand Philosophy
- **Professional Trading Platform** - Clean, sophisticated, data-focused
- **Dark-First Design** - All components designed for dark backgrounds
- **Premium Feel** - Gold accents, multi-layer shadows, quality materials
- **Trading-Optimized** - Color-coded P&L, numerical clarity, status indicators

---

## 🎯 **COLOR PALETTE**

### Core Colors
```css
/* Backgrounds (Required Dark Mode) */
--background-primary: #0a0a0a;      /* Deepest background */
--background-surface: #111111;      /* Cards, containers */
--background-secondary: #191919;    /* Secondary surfaces */
--background-hover: #161616;        /* Hover states */
--background-input: #1a1a1a;        /* Form inputs */

/* Text Colors */
--text-primary: #e5e5e5;           /* High contrast main text */
--text-secondary: #999999;         /* Less important text */
--text-muted: #666666;             /* Subtle text, labels */
--text-code: #a3a3a3;             /* Technical/numeric text */

/* Borders */
--border-primary: #1a1a1a;         /* Standard borders */
--border-input: #2a2a2a;          /* Input field borders */
--border-subtle: #0f0f0f;         /* Very subtle dividers */
```

### Trading Status Colors
```css
/* P&L Status Colors (MANDATORY) */
--color-profit: #10b981;           /* Green - winning trades */
--color-loss: #ef4444;             /* Red - losing trades */
--color-neutral: #6b7280;          /* Gray - breakeven */

/* System Status Colors */
--color-success: #10b981;          /* Success messages */
--color-warning: #f59e0b;          /* Warnings, alerts */
--color-error: #ef4444;            /* Errors, failures */
--color-info: #3b82f6;             /* Information, focus */
```

### Color Usage Rules
| Color | Usage | Never Use For |
|-------|-------|---------------|
| Gold (#D4AF37) | Primary buttons, brand elements, key highlights | Error states, warnings |
| Green (#10b981) | Profit/gains, success states, positive metrics | Loss indicators, errors |
| Red (#ef4444) | Loss/negative P&L, errors, dangerous actions | Profit indicators, success |
| Blue (#3b82f6) | Information, focus states, neutral actions | Financial data, P&L |

---

## ✍️ **TYPOGRAPHY**

### Font Families
```css
/* Primary Font Stack */
font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
/* Use for: All UI text, headings, body content */

/* Monospace Font Stack */
font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
/* Use for: Code, financial data, numerical tables, technical content */
```

### Font Weights & Sizes
```css
/* Heading Scale */
h1: 2.25rem (36px), font-weight: 700, line-height: 1.4
h2: 1.5rem (24px),  font-weight: 700, line-height: 1.4
h3: 1.25rem (20px), font-weight: 700, line-height: 1.4
h4: 1.125rem (18px), font-weight: 600, line-height: 1.4

/* Body Text Scale */
Large:   16px, font-weight: 400, line-height: 1.7
Regular: 14px, font-weight: 400, line-height: 1.7
Small:   12px, font-weight: 400, line-height: 1.6
Tiny:    10px, font-weight: 400, line-height: 1.5
```

### Numerical Text (Financial Data)
```css
/* CRITICAL: All financial numbers must use tabular numbers */
font-variant-numeric: tabular-nums;
font-feature-settings: "tnum" 1;
font-family: 'JetBrains Mono', monospace;

/* This ensures all numbers align properly in tables */
```

### Typography Classes
```css
.metric-value {
  font-size: 1.5rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.metric-label {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.financial-number {
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
}
```

---

## 📦 **COMPONENT LIBRARY**

### Buttons

#### Primary Button (Gold)
```css
.btn-primary {
  background-color: #D4AF37;
  color: #F7F7F7;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 1px 0px rgba(255, 255, 255, 0.05) inset;
  transition: all 0.2s ease-out;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.25),
    0 8px 16px rgba(0, 0, 0, 0.15);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.2);
}
```

#### Secondary Button
```css
.btn-secondary {
  background-color: #111111;
  color: #e5e5e5;
  border: 1px solid #1a1a1a;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-out;
}

.btn-secondary:hover {
  background-color: #161616;
  transform: translateY(-1px);
}
```

### Cards & Surfaces

#### Standard Card
```css
.studio-card {
  background-color: #111111;
  border: 1px solid #1a1a1a;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 1px 0px rgba(255, 255, 255, 0.05) inset;
}

.studio-card:hover {
  background-color: #161616;
  transform: translateY(-2px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.25),
    0 8px 16px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease-out;
}
```

#### Metric Tile
```css
.metric-tile {
  background-color: #111111;
  border: 1px solid #1a1a1a;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 1px 0px rgba(255, 255, 255, 0.05) inset;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.metric-tile:hover {
  background-color: #161616;
  transform: translateY(-2px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.25),
    0 8px 16px rgba(0, 0, 0, 0.2);
}
```

### Form Inputs

#### Standard Input
```css
.studio-input {
  background-color: #1a1a1a;
  border: 1px solid #2a2a2a;
  color: #e5e5e5;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.2) inset,
    0 1px 0px rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease-out;
}

.studio-input::placeholder {
  color: #666666;
}

.studio-input:focus {
  outline: none;
  border-color: #D4AF37;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.3) inset,
    0 0 0 2px rgba(212, 175, 55, 0.2),
    0 2px 4px rgba(0, 0, 0, 0.15);
}
```

---

## 🌊 **SHADOWS & DEPTH**

### Shadow System (Multi-Layer)
```css
/* Level 1: Subtle */
.shadow-subtle {
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Level 2: Standard (Most Used) */
.shadow-standard {
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 1px 0px rgba(255, 255, 255, 0.05) inset;
}

/* Level 3: Large/Elevated */
.shadow-large {
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.25),
    0 8px 16px rgba(0, 0, 0, 0.2),
    0 16px 32px rgba(0, 0, 0, 0.1),
    0 1px 0px rgba(255, 255, 255, 0.08) inset,
    0 -1px 0px rgba(0, 0, 0, 0.15) inset;
}

/* Level 4: Prominent (Modals, etc.) */
.shadow-prominent {
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.3),
    0 16px 32px rgba(0, 0, 0, 0.25),
    0 32px 64px rgba(0, 0, 0, 0.15),
    0 1px 0px rgba(255, 255, 255, 0.1) inset;
}
```

### When to Use Each Shadow
- **Subtle**: Form inputs, subtle interactive elements
- **Standard**: Cards, buttons, most containers (DEFAULT)
- **Large**: Chart containers, elevated panels, important sections
- **Prominent**: Modals, overlays, maximum emphasis

---

## 🎭 **ANIMATIONS & TRANSITIONS**

### Standard Transitions
```css
/* Default Transition (Use everywhere) */
transition: all 0.2s ease-out;

/* Material Design Easing (Important changes) */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Hover States */
.interactive-element:hover {
  transform: translateY(-1px);  /* Lift effect */
  transition: all 0.2s ease-out;
}

/* Active States */
.interactive-element:active {
  transform: translateY(0);     /* Return to ground */
}
```

### Custom Animations
```css
/* Soft Pulse (Status indicators) */
@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.animate-pulse-soft {
  animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Glow Effect (AI indicators) */
@keyframes glow {
  0%, 100% { text-shadow: 0 0 10px #3b82f6; }
  50% { text-shadow: 0 0 30px #3b82f6; }
}

.animate-glow {
  animation: glow 2s ease-in-out infinite;
}
```

---

## 📐 **SPACING & LAYOUT**

### Spacing Scale
```css
/* Base: 4px increments */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
```

### Standard Component Spacing
```css
/* Button Padding */
.btn { padding: 0.5rem 1rem; }        /* 8px 16px */

/* Card Padding */
.card { padding: 1.5rem; }             /* 24px */

/* Form Input Padding */
.input { padding: 0.5rem 0.75rem; }   /* 8px 12px */

/* Section Spacing */
.section {
  padding-top: 3rem;     /* 48px */
  padding-bottom: 3rem;  /* 48px */
}
```

### Container Sizes
```css
/* Page Containers */
.container-sm { max-width: 768px; }    /* Small content */
.container-md { max-width: 1024px; }   /* Medium content */
.container-lg { max-width: 1280px; }   /* Large content */
.container-xl { max-width: 1400px; }   /* Extra large (custom) */

/* All containers: margin: 0 auto for centering */
```

---

## 📱 **RESPONSIVE DESIGN**

### Breakpoints
```css
/* Mobile First Approach */
/* Default: < 640px (mobile) */

/* Tablet */
@media (min-width: 640px) { /* sm */ }

/* Desktop */
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1400px) { /* 2xl - custom */ }
```

### Responsive Patterns
```css
/* Grid Layouts */
.responsive-grid {
  display: grid;
  grid-template-columns: 1fr;           /* Mobile: 1 column */
  gap: 1rem;
}

@media (min-width: 768px) {
  .responsive-grid {
    grid-template-columns: repeat(2, 1fr); /* Tablet: 2 columns */
  }
}

@media (min-width: 1024px) {
  .responsive-grid {
    grid-template-columns: repeat(3, 1fr); /* Desktop: 3 columns */
  }
}

/* Typography Scaling */
.responsive-heading {
  font-size: 1.5rem;    /* Mobile: 24px */
}

@media (min-width: 768px) {
  .responsive-heading {
    font-size: 2rem;     /* Tablet: 32px */
  }
}

@media (min-width: 1024px) {
  .responsive-heading {
    font-size: 2.25rem;  /* Desktop: 36px */
  }
}
```

---

## 🎯 **STATUS INDICATORS**

### Trading Status Colors
```css
/* Profit/Loss Indicators */
.pnl-positive {
  color: #10b981;  /* Green */
}

.pnl-negative {
  color: #ef4444;  /* Red */
}

.pnl-neutral {
  color: #6b7280;  /* Gray */
}

/* Status Badges */
.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-online {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-offline {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.status-loading {
  background-color: rgba(251, 191, 36, 0.1);
  color: #f59e0b;
  border: 1px solid rgba(251, 191, 36, 0.2);
}
```

---

## 🏗️ **IMPLEMENTATION GUIDE**

### Required CSS Variables (Add to :root)
```css
:root {
  /* Brand Colors */
  --primary: hsl(45, 93%, 35%);          /* #D4AF37 - Traderra Gold */
  --primary-foreground: hsl(0, 0%, 98%);

  /* Backgrounds */
  --background: hsl(0, 0%, 4%);          /* #0a0a0a */
  --card: hsl(0, 0%, 7%);                /* #111111 */
  --popover: hsl(0, 0%, 7%);
  --muted: hsl(0, 0%, 10%);              /* #191919 */
  --accent: hsl(0, 0%, 10%);

  /* Text Colors */
  --foreground: hsl(0, 0%, 90%);         /* #e5e5e5 */
  --muted-foreground: hsl(0, 0%, 40%);   /* #666666 */
  --card-foreground: hsl(0, 0%, 90%);

  /* Borders */
  --border: hsl(0, 0%, 10%);             /* #1a1a1a */
  --input: hsl(0, 0%, 10%);
  --ring: hsl(214, 100%, 59%);           /* #3b82f6 - Focus ring */

  /* Status Colors */
  --destructive: hsl(0, 72%, 51%);       /* #ef4444 */
  --destructive-foreground: hsl(0, 0%, 98%);

  /* Trading Colors */
  --trading-profit: hsl(158, 64%, 52%);  /* #10b981 */
  --trading-loss: hsl(0, 72%, 51%);      /* #ef4444 */
  --trading-neutral: hsl(220, 9%, 46%);  /* #6b7280 */
}
```

### Required Dark Mode Class
```css
/* CRITICAL: Force dark mode everywhere */
.dark {
  /* This class must be applied to <html> or <body> */
  /* All components depend on this being present */
}

/* Dark mode is mandatory - no light mode support */
```

### Font Loading (Required)
```html
<!-- Add to document head -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet">
```

---

## 📋 **COMPONENT CHECKLIST**

### ✅ Required Elements for Every Component
- [ ] Dark background (#111111 or #0a0a0a)
- [ ] Multi-layer shadow with inset light edge
- [ ] Border radius: 0.375rem (6px)
- [ ] Text color: #e5e5e5 (high contrast)
- [ ] Hover states with translateY(-1px)
- [ ] 200ms ease-out transitions
- [ ] Focus states with gold ring (#D4AF37)
- [ ] Responsive design (mobile-first)

### ✅ Trading-Specific Requirements
- [ ] P&L colors: Green (#10b981) / Red (#ef4444)
- [ ] Tabular numbers for financial data
- [ ] JetBrains Mono for numeric content
- [ ] Status indicators with proper colors
- [ ] Gold accent color for primary actions

---

## 🚀 **QUICK START TEMPLATE**

### Basic Page Structure
```html
<!DOCTYPE html>
<html class="dark">
<head>
  <!-- Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet">

  <!-- Your CSS with variables -->
  <link href="styles.css" rel="stylesheet">
</head>
<body class="bg-[#0a0a0a] text-[#e5e5e5] font-sans">
  <!-- Page content -->
  <div class="min-h-screen bg-[#0a0a0a]">
    <!-- Your components here -->
  </div>
</body>
</html>
```

### Sample Component
```html
<!-- Metric Card Example -->
<div class="studio-card">
  <div class="metric-tile">
    <div class="metric-value text-[#10b981]">+$1,247.50</div>
    <div class="metric-label">Today's P&L</div>
  </div>

  <button class="btn-primary mt-4">
    View Details
  </button>
</div>
```

---

## 📄 **FILES TO REFERENCE**

```
Source Files (Traderra Frontend):
- /src/styles/globals.css        → CSS variables
- /tailwind.config.js            → Theme extensions
- /src/components/ui/            → Component examples
- /src/components/dashboard/     → Layout patterns

Copy these exact styles for consistency across platforms.
```

---

## 🏷️ **BRAND STANDARDS SUMMARY**

### DO ✅
- Use #D4AF37 (gold) for primary brand elements
- Use #10b981 (green) for profits/gains
- Use #ef4444 (red) for losses/errors
- Use multi-layer shadows on all surfaces
- Use Inter font for UI, JetBrains Mono for numbers
- Use 200ms ease-out transitions
- Force dark mode everywhere
- Use tabular numbers for financial data

### DON'T ❌
- Use light mode or offer theme switching
- Use blue or other colors for P&L data
- Use Arial/Helvetica instead of Inter
- Skip the multi-layer shadows
- Use single-layer flat shadows
- Use colors other than gold for primary actions
- Mix different font families in the same context
- Use proportional numbers for financial tables

---

**Document Version:** 1.0
**Last Updated:** November 2024
**Source:** Traderra Frontend (localhost:6565)
**Status:** Production Ready

*This brand kit ensures perfect consistency across all Traderra platforms and applications.*