# Traderra Design System & Branding Kit
**The Complete Guide for Building Consistent Traderra Platforms**

---

## 📋 **Table of Contents**

1. [Brand Identity](#brand-identity)
2. [Design Tokens](#design-tokens)
3. [Typography System](#typography-system)
4. [Color Palette](#color-palette)
5. [Component Library](#component-library)
6. [Layout Patterns](#layout-patterns)
7. [Shadow & Depth System](#shadow--depth-system)
8. [Animation Guidelines](#animation-guidelines)
9. [AI Agent Integration](#ai-agent-integration)
10. [Code Templates](#code-templates)

---

## 🎯 **Brand Identity**

### Core Values
- **Professional Trading Platform**: Dark, sophisticated aesthetic for serious traders
- **AI-Powered Intelligence**: Seamless integration with Renata AI assistant
- **Data-Driven**: Clear hierarchy for financial data presentation
- **Premium Experience**: Depth, shadows, and micro-interactions

### Brand Positioning
- **Primary Use**: Professional trading journal and analytics platform
- **Target User**: Serious day traders, swing traders, professional investors
- **Tone**: Professional, intelligent, trustworthy, sophisticated

### Logo & Icon Usage
```typescript
// Primary Logo Component
<Brain className="h-7 w-7 text-primary" />
<span className="text-xl font-bold studio-text">Traderra</span>

// Variations
// Icon only: <Brain className="h-6 w-6 text-primary" />
// Text only: "Traderra" in Inter font, font-bold
```

---

## 🎨 **Design Tokens**

### CSS Custom Properties
```css
:root {
  /* Studio Theme (Traderra Dark) */
  --studio-bg: #0a0a0a;           /* Main background */
  --studio-surface: #111111;      /* Card/surface background */
  --studio-border: #1a1a1a;       /* Border color */
  --studio-text: #e5e5e5;         /* Primary text */
  --studio-muted: #666666;        /* Secondary text */
  --studio-accent: #d97706;       /* Gold accent */

  /* Trading Colors */
  --trading-profit: #10b981;      /* Green for profits */
  --trading-loss: #ef4444;        /* Red for losses */
  --trading-neutral: #6b7280;     /* Gray for neutral */

  /* Primary Colors */
  --primary: 45 93% 35%;           /* Gold/amber primary */
  --primary-foreground: 0 0% 98%; /* White text on primary */

  /* Semantic Colors */
  --background: 0 0% 4%;           /* Page background */
  --foreground: 0 0% 90%;          /* Text color */
  --muted: 0 0% 10%;               /* Muted background */
  --muted-foreground: 0 0% 40%;    /* Muted text */
  --border: 0 0% 10%;              /* Default border */
  --input: 0 0% 10%;               /* Input background */
  --ring: 214 100% 59%;            /* Focus ring */
}
```

### JavaScript/React Tokens
```typescript
export const TraderraTokens = {
  colors: {
    background: '#0a0a0a',
    surface: '#111111',
    border: '#1a1a1a',
    text: '#e5e5e5',
    muted: '#666666',
    accent: '#d97706',
    profit: '#10b981',
    loss: '#ef4444',
    neutral: '#6b7280',
    primary: '#B8860B', // Gold primary
  },
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
  },
  borderRadius: {
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
  }
}
```

---

## 📝 **Typography System**

### Font Stack
```css
/* Primary Font - Inter */
font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace - JetBrains Mono */
font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
```

### Typography Scale
```css
/* Headings */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }    /* 36px */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }  /* 30px */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }       /* 24px */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }    /* 20px */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }   /* 18px */

/* Body Text */
.text-base { font-size: 1rem; line-height: 1.5rem; }      /* 16px */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }   /* 14px */
.text-xs { font-size: 0.75rem; line-height: 1rem; }       /* 12px */

/* Financial Numbers */
.number-font {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  font-family: 'JetBrains Mono', monospace;
}
```

### Font Usage Guidelines
```typescript
// Headings and UI Labels
<h1 className="text-2xl font-bold studio-text">Page Title</h1>
<h2 className="text-xl font-semibold studio-text">Section Title</h2>
<p className="text-sm studio-muted">Helper text</p>

// Financial Data (ALWAYS use number-font)
<span className="number-font text-lg font-semibold">$1,234.56</span>
<span className="number-font text-sm pnl-positive">+5.67%</span>

// Navigation and Buttons
<span className="text-sm font-medium">Navigation Item</span>
```

---

## 🎨 **Color Palette**

### Primary Colors
```css
/* Gold/Amber Primary */
.bg-primary { background-color: #B8860B; }
.text-primary { color: #B8860B; }
.border-primary { border-color: #B8860B; }

/* Active states */
.bg-primary-active { background-color: #d97706; }
.text-primary-foreground { color: #000000; } /* Black text on gold */
```

### Studio Theme Colors
```css
/* Backgrounds */
.studio-bg { background-color: #0a0a0a; }        /* Main background */
.studio-surface { background-color: #111111; }   /* Cards, modals */

/* Text Colors */
.studio-text { color: #e5e5e5; }                 /* Primary text */
.studio-muted { color: #666666; }                /* Secondary text */

/* Borders */
.studio-border { border-color: #1a1a1a; }        /* Subtle borders */
```

### Trading-Specific Colors
```css
/* P&L Colors */
.profit-text { color: #10b981; }      /* Green for profits */
.loss-text { color: #ef4444; }        /* Red for losses */
.neutral-text { color: #6b7280; }     /* Gray for neutral */

/* Background variants */
.profit-bg { background-color: rgba(16, 185, 129, 0.1); }
.loss-bg { background-color: rgba(239, 68, 68, 0.1); }
```

### Interactive States
```css
/* Hover states */
.hover\:bg-accent:hover { background-color: rgba(217, 119, 6, 0.1); }
.hover\:studio-text:hover { color: #e5e5e5; }

/* Focus states */
.focus\:ring-primary:focus {
  box-shadow: 0 0 0 2px rgba(184, 134, 11, 0.5);
}
```

---

## 🧩 **Component Library**

### Button Components

#### Primary Button
```typescript
// Primary action button
<button className="btn-primary">
  Save Changes
</button>

// CSS Classes
.btn-primary {
  @apply bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium;
  transition: all 0.2s ease-out;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 1px 0px rgba(255, 255, 255, 0.1) inset;
}
```

#### Secondary Button
```typescript
// Secondary action button
<button className="btn-secondary">
  Cancel
</button>

// CSS Classes
.btn-secondary {
  @apply studio-surface hover:bg-[#161616] studio-text px-4 py-2 rounded-lg font-medium;
  transition: all 0.2s ease-out;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.2),
    0 1px 0px rgba(255, 255, 255, 0.05) inset;
}
```

#### Ghost Button
```typescript
// Subtle action button
<button className="btn-ghost">
  <Settings className="h-4 w-4" />
  Settings
</button>

// CSS Classes
.btn-ghost {
  @apply hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-lg font-medium;
  transition: all 0.2s ease-out;
}
```

### Display Mode Toggle
```typescript
// Core toggle component used throughout Traderra
import { DisplayModeToggle } from '@/components/ui/display-mode-toggle'

// Usage examples
<DisplayModeToggle variant="flat" size="md" />          // Clean flat style
<DisplayModeToggle variant="compact" size="sm" />       // Compact grouped
<DisplayModeToggle variant="icon-only" size="lg" />     // Icons only

// Variants:
// - 'default': Full buttons with icons and labels
// - 'compact': Grouped buttons in container
// - 'flat': Clean separated buttons (recommended)
// - 'icon-only': Icons only for space-constrained areas
```

### Card Components

#### Studio Surface Card
```typescript
// Primary content card
<div className="studio-surface rounded-lg p-6">
  <h3 className="text-lg font-semibold studio-text mb-4">Card Title</h3>
  <p className="studio-muted">Card content...</p>
</div>

// With enhanced shadow
<div className="studio-surface rounded-lg p-6 shadow-studio-lg">
  Content with elevated appearance
</div>
```

#### Metric Tile
```typescript
// Financial metric display
<div className="metric-tile">
  <div className="metric-tile-value profit-text">$12,345.67</div>
  <div className="metric-tile-label">Total P&L</div>
</div>

// Auto-hover effects and professional depth included
```

### Navigation Components

#### Top Navigation
```typescript
import { TopNavigation } from '@/components/layout/top-nav'

// Usage
<TopNavigation
  onAiToggle={() => setAiSidebarOpen(!aiSidebarOpen)}
  aiOpen={aiSidebarOpen}
/>

// Features:
// - Brain icon + "Traderra" branding
// - Navigation links with active states
// - AI toggle button for Renata
// - User profile integration
```

### Form Components

#### Professional Input
```typescript
// Styled input field
<input
  type="text"
  className="form-input"
  placeholder="Enter value..."
/>

// CSS Classes
.form-input {
  @apply studio-surface studio-border rounded-lg px-3 py-2 text-sm;
  transition: all 0.2s ease-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) inset;
}

.form-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(184, 134, 11, 0.2);
}
```

### Loading Components

#### Loading Spinner
```typescript
// Standard loading spinner
<div className="flex items-center justify-center p-4">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  <span className="ml-2 studio-muted">Loading...</span>
</div>
```

#### Skeleton Loading
```typescript
// Content skeleton
<div className="skeleton h-4 w-full mb-2"></div>
<div className="skeleton h-4 w-3/4 mb-2"></div>
<div className="skeleton h-4 w-1/2"></div>

// CSS
.skeleton {
  @apply animate-pulse bg-muted rounded;
}
```

---

## 📐 **Layout Patterns**

### Page Layout Structure
```typescript
// Standard page wrapper
export default function PageComponent() {
  return (
    <div className="flex h-screen studio-bg">
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNavigation onAiToggle={toggleAI} aiOpen={aiOpen} />

        {/* Page Header */}
        <div className="studio-surface border-b studio-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold studio-text">Page Title</h1>
            <div className="flex items-center space-x-4">
              {/* Action buttons */}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 p-6">
          {/* Content */}
        </div>
      </div>

      {/* AI Sidebar (optional) */}
      {aiSidebarOpen && (
        <div className="w-[480px] studio-surface border-l studio-border">
          <RenataChat />
        </div>
      )}
    </div>
  )
}
```

### Grid Layouts
```typescript
// Responsive metric grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {metrics.map(metric => (
    <div key={metric.id} className="metric-tile">
      {/* Metric content */}
    </div>
  ))}
</div>

// Dashboard layout
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Left column - 2/3 width */}
  <div className="lg:col-span-2">
    <div className="chart-container">
      {/* Chart component */}
    </div>
  </div>

  {/* Right column - 1/3 width */}
  <div className="space-y-6">
    {/* Sidebar widgets */}
  </div>
</div>
```

### Scrollable Areas
```typescript
// Journal/content scrolling pattern
<div className="flex flex-col h-full min-h-0">
  {/* Fixed header */}
  <div className="shrink-0 p-6 border-b studio-border">
    <h2>Section Header</h2>
  </div>

  {/* Scrollable content */}
  <div className="flex-1 overflow-y-auto p-6">
    <div className="space-y-6">
      {/* Content items */}
    </div>
  </div>
</div>
```

### Modal/Dialog Patterns
```typescript
// Standard modal structure
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div className="studio-surface rounded-lg p-6 w-full max-w-lg mx-4 shadow-studio-prominent">
    {/* Modal header */}
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold studio-text">Modal Title</h3>
      <button className="btn-ghost p-1">
        <X className="h-4 w-4" />
      </button>
    </div>

    {/* Modal content */}
    <div className="mb-6">
      {/* Content */}
    </div>

    {/* Modal actions */}
    <div className="flex justify-end space-x-3">
      <button className="btn-secondary">Cancel</button>
      <button className="btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

---

## 🌊 **Shadow & Depth System**

### Shadow Hierarchy
```css
/* Subtle - Flat elements with minimal depth */
.shadow-studio-subtle {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

/* Standard - Cards and surfaces */
.shadow-studio {
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 1px 0px rgba(255, 255, 255, 0.05) inset;
}

/* Large - Important cards and containers */
.shadow-studio-lg {
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.25),
    0 8px 16px rgba(0, 0, 0, 0.2),
    0 16px 32px rgba(0, 0, 0, 0.1),
    0 1px 0px rgba(255, 255, 255, 0.08) inset;
}

/* Prominent - Modals and critical elements */
.shadow-studio-prominent {
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.3),
    0 16px 32px rgba(0, 0, 0, 0.25),
    0 32px 64px rgba(0, 0, 0, 0.15),
    0 1px 0px rgba(255, 255, 255, 0.1) inset;
}
```

### Interactive Shadows
```css
/* Interactive hover effects */
.shadow-interactive {
  transition: all 0.2s ease-out;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.shadow-interactive:hover {
  transform: translateY(-1px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.2),
    0 8px 16px rgba(0, 0, 0, 0.15);
}
```

---

## ⚡ **Animation Guidelines**

### Transition Standards
```css
/* Standard transitions */
.transition-standard {
  transition: all 0.2s ease-out;
}

/* Longer transitions for complex changes */
.transition-long {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Micro-interactions */
.transition-micro {
  transition: all 0.15s ease-out;
}
```

### Custom Animations
```css
/* Soft pulsing for status indicators */
.animate-pulse-soft {
  animation: pulse-soft 2s ease-in-out infinite;
}

@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* Glow effect for special elements */
.animate-glow {
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from { text-shadow: 0 0 10px #3b82f6; }
  to { text-shadow: 0 0 20px #3b82f6, 0 0 30px #3b82f6; }
}
```

### Animation Usage
```typescript
// Hover animations
<button className="btn-primary transform hover:scale-105 transition-transform">
  Hover me
</button>

// Loading states
<div className="animate-pulse-soft">Loading content...</div>

// Status indicators
<div className="status-online animate-pulse-soft"></div>
```

---

## 🤖 **AI Agent Integration**

### Component Creation Guidelines for AI

#### Essential Imports Template
```typescript
import { cn } from '@/lib/utils'
import { Brain, Settings, TrendingUp, /* other icons */ } from 'lucide-react'

// For display modes
import { useDisplayMode } from '@/contexts/DisplayModeContext'

// For P&L context
import { usePnLMode } from '@/contexts/PnLModeContext'

// For date ranges
import { useDateRange } from '@/contexts/DateRangeContext'
```

#### Standard Component Structure
```typescript
interface ComponentProps {
  className?: string
  children?: React.ReactNode
  // Other props...
}

export function ComponentName({
  className,
  children,
  ...props
}: ComponentProps) {
  return (
    <div className={cn(
      "studio-surface rounded-lg p-6", // Base Traderra styles
      className // Allow customization
    )}>
      {children}
    </div>
  )
}
```

#### Financial Data Display Pattern
```typescript
// ALWAYS use this pattern for financial data
export function FinancialMetric({
  value,
  label,
  type = 'neutral'
}: {
  value: number
  label: string
  type?: 'profit' | 'loss' | 'neutral'
}) {
  const { displayMode } = useDisplayMode()

  const formatValue = (val: number) => {
    switch (displayMode) {
      case 'dollar': return `$${val.toFixed(2)}`
      case 'percent': return `${val.toFixed(2)}%`
      case 'r': return `${val.toFixed(2)}R`
      default: return `$${val.toFixed(2)}`
    }
  }

  return (
    <div className="metric-tile">
      <div className={cn(
        "metric-tile-value number-font",
        type === 'profit' && "profit-text",
        type === 'loss' && "loss-text",
        type === 'neutral' && "studio-text"
      )}>
        {formatValue(value)}
      </div>
      <div className="metric-tile-label">{label}</div>
    </div>
  )
}
```

### AI Agent Code Templates

#### Page Creation Template
```typescript
'use client'

import { useState } from 'react'
import { TopNavigation } from '@/components/layout/top-nav'
import { RenataChat } from '@/components/dashboard/renata-chat'

export default function NewPage() {
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen studio-bg">
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNavigation
          onAiToggle={() => setAiSidebarOpen(!aiSidebarOpen)}
          aiOpen={aiSidebarOpen}
        />

        <div className="studio-surface border-b studio-border px-6 py-4">
          <h1 className="text-xl font-semibold studio-text">Page Title</h1>
        </div>

        <div className="flex-1 min-h-0 p-6">
          {/* Your content here */}
        </div>
      </div>

      {aiSidebarOpen && (
        <div className="w-[480px] studio-surface border-l studio-border">
          <RenataChat />
        </div>
      )}
    </div>
  )
}
```

#### Modal Creation Template
```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function TraderraModal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="studio-surface rounded-lg p-6 w-full max-w-lg mx-4 shadow-studio-prominent">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold studio-text">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
```

### Required Context Providers
```typescript
// Wrap all Traderra components in these providers
<StudioTheme>
  <DisplayModeProvider>
    <PnLModeProvider>
      <DateRangeProvider>
        {/* Your components */}
      </DateRangeProvider>
    </PnLModeProvider>
  </DisplayModeProvider>
</StudioTheme>
```

---

## 📝 **Code Templates**

### Quick Component Starter
```typescript
'use client'

import { cn } from '@/lib/utils'

interface NewComponentProps {
  className?: string
  // Add your props here
}

export function NewComponent({
  className,
  ...props
}: NewComponentProps) {
  return (
    <div className={cn(
      "studio-surface rounded-lg p-6", // Base Traderra styling
      className
    )}>
      {/* Your component content */}
    </div>
  )
}
```

### Trading Card Template
```typescript
export function TradingCard({
  title,
  value,
  type = 'neutral',
  className
}: {
  title: string
  value: string | number
  type?: 'profit' | 'loss' | 'neutral'
  className?: string
}) {
  return (
    <div className={cn("metric-tile shadow-interactive", className)}>
      <div className={cn(
        "metric-tile-value number-font",
        type === 'profit' && "profit-text",
        type === 'loss' && "loss-text",
        type === 'neutral' && "studio-text"
      )}>
        {value}
      </div>
      <div className="metric-tile-label">{title}</div>
    </div>
  )
}
```

### Form Template
```typescript
export function TraderraForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium studio-text mb-2">
          Field Label
        </label>
        <input
          type="text"
          className="form-input w-full"
          placeholder="Enter value..."
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button type="button" className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Save
        </button>
      </div>
    </form>
  )
}
```

---

## ✅ **Quality Checklist**

### Before Using This Design System

- [ ] **Colors**: All colors use Traderra studio theme tokens
- [ ] **Typography**: Financial numbers use `number-font` class
- [ ] **Shadows**: Appropriate shadow depth for component hierarchy
- [ ] **Interactive States**: Hover and focus states implemented
- [ ] **Responsive**: Component works on mobile and desktop
- [ ] **Accessibility**: Proper ARIA labels and keyboard navigation
- [ ] **Context Integration**: Uses display mode, PnL mode when relevant
- [ ] **Loading States**: Skeleton or spinner for async content
- [ ] **Error Handling**: Graceful error states with studio theme

### Consistency Requirements

- [ ] **Spacing**: Uses consistent padding/margin scale (0.25rem increments)
- [ ] **Border Radius**: Uses standard radius values (0.375rem to 1rem)
- [ ] **Animations**: Uses standard transition timing (0.2s ease-out)
- [ ] **Icons**: Lucide React icons at appropriate sizes (h-4 w-4 to h-6 w-6)
- [ ] **Text Hierarchy**: Proper heading levels and text sizes

---

## 📚 **Usage Examples**

### Building a New Trading Dashboard Widget

```typescript
'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDisplayMode } from '@/contexts/DisplayModeContext'

export function ProfitLossWidget({ trades }: { trades: Trade[] }) {
  const { displayMode } = useDisplayMode()
  const [timeframe, setTimeframe] = useState('7d')

  const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0)
  const isProfit = totalPnL >= 0

  return (
    <div className="studio-surface rounded-lg p-6 shadow-studio-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold studio-text">P&L Overview</h3>
        <div className="flex items-center space-x-1">
          {['7d', '30d', '90d'].map(period => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={cn(
                "px-3 py-1 text-sm rounded transition-colors",
                timeframe === period
                  ? "bg-primary text-primary-foreground"
                  : "studio-muted hover:studio-text"
              )}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Main Metric */}
      <div className="flex items-center space-x-3">
        <div className={cn(
          "p-2 rounded-lg",
          isProfit ? "bg-green-500/10" : "bg-red-500/10"
        )}>
          {isProfit ? (
            <TrendingUp className="h-6 w-6 text-green-500" />
          ) : (
            <TrendingDown className="h-6 w-6 text-red-500" />
          )}
        </div>

        <div>
          <div className={cn(
            "text-2xl font-bold number-font",
            isProfit ? "profit-text" : "loss-text"
          )}>
            {displayMode === 'dollar' && `$${totalPnL.toFixed(2)}`}
            {displayMode === 'percent' && `${(totalPnL / 10000 * 100).toFixed(2)}%`}
            {displayMode === 'r' && `${(totalPnL / 500).toFixed(2)}R`}
          </div>
          <div className="text-sm studio-muted">
            Total P&L ({timeframe})
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 🚀 **Getting Started with AI Agents**

### For AI Agents Building Traderra Components:

1. **Always import the design system first**:
   ```typescript
   import { cn } from '@/lib/utils'
   import { /* needed icons */ } from 'lucide-react'
   ```

2. **Use the component template as base**:
   Start with the component starter template and modify as needed.

3. **Apply Traderra classes systematically**:
   - Background: `studio-bg` or `studio-surface`
   - Text: `studio-text` or `studio-muted`
   - Borders: `studio-border`
   - Financial numbers: `number-font` + appropriate PnL color

4. **Include interactive states**:
   ```typescript
   className={cn(
     "base-styles",
     "hover:bg-accent transition-colors",
     "shadow-interactive",
     conditionalClasses
   )}
   ```

5. **Test with context providers**:
   Ensure your component works within the Traderra context system.

---

This design system ensures **100% brand consistency** across all Traderra platforms. Every component, every color, every interaction follows the established patterns that make Traderra feel professional, cohesive, and premium.

**Ready to build the next Traderra platform? Use this guide as your single source of truth.** 🎯