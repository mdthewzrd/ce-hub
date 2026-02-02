# Traderra AI Agent Cheat Sheet
**Essential Patterns for Building On-Brand Traderra Components**

---

## 🎯 **Essential Imports**
```typescript
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { Brain, Settings, TrendingUp, DollarSign, Target } from 'lucide-react'
import { useDisplayMode } from '@/contexts/DisplayModeContext'
```

---

## 🎨 **Core CSS Classes**

| Purpose | Class | Usage |
|---------|-------|-------|
| **Background** | `studio-bg` | Main page background |
| **Surface** | `studio-surface` | Cards, modals, containers |
| **Text** | `studio-text` | Primary text color |
| **Muted Text** | `studio-muted` | Secondary text |
| **Border** | `studio-border` | Consistent borders |
| **Financial Numbers** | `number-font` | ALL financial data |
| **Profit** | `profit-text` | Green profit color |
| **Loss** | `loss-text` | Red loss color |

---

## 🧩 **Component Templates**

### Standard Component
```typescript
export function MyComponent({ className, ...props }: ComponentProps) {
  return (
    <div className={cn(
      "studio-surface rounded-lg p-6 shadow-studio",
      className
    )}>
      {/* Content */}
    </div>
  )
}
```

### Financial Metric Card
```typescript
<div className="metric-tile shadow-interactive">
  <div className="metric-tile-value number-font profit-text">
    $1,234.56
  </div>
  <div className="metric-tile-label">Total P&L</div>
</div>
```

### Button Set
```typescript
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-ghost">Subtle Action</button>
```

---

## 📐 **Layout Patterns**

### Page Structure
```typescript
<div className="flex h-screen studio-bg">
  <div className="flex flex-1 flex-col overflow-hidden">
    <TopNavigation onAiToggle={fn} aiOpen={bool} />

    <div className="studio-surface border-b studio-border px-6 py-4">
      <h1 className="text-xl font-semibold studio-text">Title</h1>
    </div>

    <div className="flex-1 min-h-0 p-6">
      {/* Content */}
    </div>
  </div>

  {aiOpen && (
    <div className="w-[480px] studio-surface border-l studio-border">
      <RenataChat />
    </div>
  )}
</div>
```

### Scrollable Content
```typescript
<div className="flex flex-col h-full min-h-0">
  <div className="shrink-0">{/* Fixed header */}</div>
  <div className="flex-1 overflow-y-auto">
    {/* Scrollable content */}
  </div>
</div>
```

### Responsive Grid
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Auto-responsive cards */}
</div>
```

---

## 💰 **Financial Data Patterns**

### Display Mode Integration
```typescript
const { displayMode } = useDisplayMode()

const formatValue = (value: number) => {
  switch (displayMode) {
    case 'dollar': return `$${value.toFixed(2)}`
    case 'percent': return `${value.toFixed(2)}%`
    case 'r': return `${value.toFixed(2)}R`
    default: return `$${value.toFixed(2)}`
  }
}

// Always use with number-font class
<span className="number-font profit-text">
  {formatValue(pnlValue)}
</span>
```

### P&L Color Logic
```typescript
const getPnLClass = (value: number) => {
  if (value > 0) return 'profit-text'
  if (value < 0) return 'loss-text'
  return 'studio-text'
}
```

---

## 🎛️ **Interactive Elements**

### Display Mode Toggle
```typescript
import { DisplayModeToggle } from '@/components/ui/display-mode-toggle'

<DisplayModeToggle variant="flat" size="md" />
```

### Status Indicators
```typescript
<div className="status-online animate-pulse-soft" />  {/* Green */}
<div className="status-offline" />                   {/* Red */}
<div className="status-loading animate-pulse" />     {/* Yellow */}
```

### Loading States
```typescript
// Spinner
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />

// Skeleton
<div className="skeleton h-4 w-full" />
```

---

## 🎨 **Color Quick Reference**

```css
/* Backgrounds */
#0a0a0a  /* studio-bg - main background */
#111111  /* studio-surface - cards */
#1a1a1a  /* studio-border - borders */

/* Text */
#e5e5e5  /* studio-text - primary */
#666666  /* studio-muted - secondary */

/* Trading */
#10b981  /* profit-text - green */
#ef4444  /* loss-text - red */
#6b7280  /* neutral - gray */

/* Primary */
#B8860B  /* primary - gold */
#d97706  /* accent - darker gold */
```

---

## 📝 **Form Patterns**

### Input Field
```typescript
<input
  type="text"
  className="form-input w-full"
  placeholder="Enter value..."
/>
```

### Form Layout
```typescript
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium studio-text mb-2">
      Field Label
    </label>
    <input className="form-input w-full" />
  </div>

  <div className="flex justify-end space-x-3">
    <button className="btn-secondary">Cancel</button>
    <button className="btn-primary">Save</button>
  </div>
</div>
```

---

## 🎯 **Shadow System**

```css
shadow-studio-subtle    /* Minimal depth */
shadow-studio          /* Standard cards */
shadow-studio-lg       /* Important elements */
shadow-studio-prominent /* Modals */
shadow-interactive     /* Hover effects */
```

---

## 📱 **Responsive Utilities**

```typescript
// Mobile-first approach
"grid-cols-1 md:grid-cols-2 lg:grid-cols-4"    // Responsive grid
"hidden md:flex"                               // Hide on mobile
"md:hidden"                                    // Show only on mobile
"px-4 md:px-6 lg:px-8"                       // Responsive padding
```

---

## ⚡ **Performance Best Practices**

```typescript
// Memoize expensive components
const MetricCard = memo(function MetricCard(props) { ... })

// Lazy load heavy components
const HeavyChart = lazy(() => import('./HeavyChart'))

// Use proper keys in lists
{items.map(item => (
  <Component key={item.id} data={item} />
))}
```

---

## 🧪 **Testing Setup**

```typescript
import { render } from '@testing-library/react'
import { StudioTheme } from '@/components/providers/studio-theme'
import { DisplayModeProvider } from '@/contexts/DisplayModeContext'

const renderWithProviders = (component) => {
  return render(
    <StudioTheme>
      <DisplayModeProvider>
        {component}
      </DisplayModeProvider>
    </StudioTheme>
  )
}
```

---

## 🚨 **Critical Requirements**

### ✅ Always Include
- [ ] `cn()` for className merging
- [ ] `studio-*` theme classes
- [ ] `number-font` for financial data
- [ ] Proper TypeScript interfaces
- [ ] Hover/focus states
- [ ] Loading states
- [ ] Error boundaries

### ❌ Never Do
- ❌ Use hardcoded colors (use CSS custom properties)
- ❌ Financial numbers without `number-font`
- ❌ Interactive elements without hover states
- ❌ Components without proper TypeScript types
- ❌ Missing accessibility attributes
- ❌ Non-responsive layouts

---

## 🎯 **Quick Component Checklist**

When creating any Traderra component:

1. **Start with template**: Use standard component structure
2. **Apply theme classes**: `studio-surface`, `studio-text`, etc.
3. **Add interactions**: Hover states, transitions
4. **Financial data**: Use `number-font` + proper colors
5. **Make responsive**: Mobile-first approach
6. **Include states**: Loading, error, empty
7. **Test with contexts**: DisplayMode, PnL, etc.

---

## 🚀 **Instant Copy-Paste Templates**

### Quick Metric Card
```typescript
<div className="metric-tile shadow-interactive">
  <div className="metric-tile-value number-font profit-text">
    $1,234.56
  </div>
  <div className="metric-tile-label">Metric Name</div>
</div>
```

### Quick Button Group
```typescript
<div className="flex items-center space-x-3">
  <button className="btn-secondary">Cancel</button>
  <button className="btn-primary">Confirm</button>
</div>
```

### Quick Modal
```typescript
{isOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="studio-surface rounded-lg p-6 w-full max-w-lg mx-4 shadow-studio-prominent">
      <h3 className="text-lg font-semibold studio-text mb-4">Modal Title</h3>
      {/* Content */}
    </div>
  </div>
)}
```

---

**Remember**: Every component should feel premium, professional, and distinctly Traderra. When in doubt, check the full design system guide! 🎯