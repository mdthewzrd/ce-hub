# Traderra Component Library Reference
**Quick Access Guide for AI Agents & Developers**

---

## 🎯 **Quick Component Index**

| Component Type | Import Path | Usage |
|----------------|-------------|-------|
| Display Mode Toggle | `@/components/ui/display-mode-toggle` | `<DisplayModeToggle variant="flat" />` |
| Top Navigation | `@/components/layout/top-nav` | `<TopNavigation onAiToggle={fn} aiOpen={bool} />` |
| Renata Chat | `@/components/dashboard/renata-chat` | `<RenataChat />` |
| Loading Spinner | `@/components/ui/loading-spinner` | `<LoadingSpinner />` |
| Toast Notifications | `@/components/ui/Toast` | `<Toast />` |

---

## 🏗️ **Core Layout Templates**

### 1. Standard Page Layout
```typescript
export default function MyPage() {
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen studio-bg">
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNavigation
          onAiToggle={() => setAiSidebarOpen(!aiSidebarOpen)}
          aiOpen={aiSidebarOpen}
        />

        <div className="studio-surface border-b studio-border px-6 py-4">
          <h1 className="text-xl font-semibold studio-text">Page Title</h1>
        </div>

        <div className="flex-1 min-h-0 p-6">
          {/* Content */}
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

### 2. Dashboard Grid Layout
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Metric cards */}
</div>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
  <div className="lg:col-span-2">
    <div className="chart-container">
      {/* Chart */}
    </div>
  </div>
  <div className="space-y-6">
    {/* Sidebar widgets */}
  </div>
</div>
```

### 3. Scrollable Content Layout
```typescript
<div className="flex flex-col h-full min-h-0">
  <div className="shrink-0 p-6 border-b studio-border">
    {/* Fixed header */}
  </div>
  <div className="flex-1 overflow-y-auto p-6">
    <div className="space-y-6">
      {/* Scrollable content */}
    </div>
  </div>
</div>
```

---

## 🎨 **Essential Components**

### Metric Display Card
```typescript
export function MetricCard({
  title,
  value,
  type = 'neutral',
  trend,
  className
}: {
  title: string
  value: string | number
  type?: 'profit' | 'loss' | 'neutral'
  trend?: 'up' | 'down' | 'flat'
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
      {trend && (
        <div className="mt-2">
          {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
          {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
          {trend === 'flat' && <Minus className="h-4 w-4 studio-muted" />}
        </div>
      )}
    </div>
  )
}
```

### Action Button Set
```typescript
export function ActionButtonSet({
  primaryAction,
  secondaryAction,
  className
}: {
  primaryAction: { label: string; onClick: () => void }
  secondaryAction?: { label: string; onClick: () => void }
  className?: string
}) {
  return (
    <div className={cn("flex items-center space-x-3", className)}>
      {secondaryAction && (
        <button onClick={secondaryAction.onClick} className="btn-secondary">
          {secondaryAction.label}
        </button>
      )}
      <button onClick={primaryAction.onClick} className="btn-primary">
        {primaryAction.label}
      </button>
    </div>
  )
}
```

### Professional Form Field
```typescript
export function FormField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false
}: {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium studio-text">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "form-input w-full",
          error && "border-red-500 focus:border-red-500"
        )}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
```

### Status Indicator
```typescript
export function StatusIndicator({
  status,
  label,
  className
}: {
  status: 'online' | 'offline' | 'loading' | 'error'
  label?: string
  className?: string
}) {
  const statusClasses = {
    online: 'status-online',
    offline: 'status-offline',
    loading: 'status-loading',
    error: 'h-2 w-2 bg-red-500 rounded-full'
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className={statusClasses[status]} />
      {label && <span className="text-sm studio-muted">{label}</span>}
    </div>
  )
}
```

### Data Table Row
```typescript
export function DataTableRow({
  data,
  columns,
  onEdit,
  onDelete,
  className
}: {
  data: Record<string, any>
  columns: Array<{ key: string; label: string; type?: 'text' | 'number' | 'currency' }>
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  className?: string
}) {
  return (
    <tr className={cn(
      "studio-surface hover:bg-[#161616] transition-colors",
      className
    )}>
      {columns.map(column => (
        <td key={column.key} className="px-4 py-3 studio-text">
          <span className={cn(
            column.type === 'number' || column.type === 'currency'
              ? "number-font"
              : ""
          )}>
            {column.type === 'currency'
              ? `$${data[column.key]?.toFixed(2)}`
              : data[column.key]
            }
          </span>
        </td>
      ))}
      {(onEdit || onDelete) && (
        <td className="px-4 py-3">
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(data.id)}
                className="btn-ghost p-1"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(data.id)}
                className="btn-ghost p-1 text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  )
}
```

---

## 🎛️ **Trading-Specific Components**

### P&L Display
```typescript
export function PnLDisplay({
  amount,
  percentage,
  rMultiple,
  showAll = false,
  className
}: {
  amount: number
  percentage?: number
  rMultiple?: number
  showAll?: boolean
  className?: string
}) {
  const { displayMode } = useDisplayMode()
  const isProfit = amount >= 0

  const getValue = () => {
    switch (displayMode) {
      case 'dollar': return `${amount >= 0 ? '+' : ''}$${amount.toFixed(2)}`
      case 'percent': return percentage ? `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%` : 'N/A'
      case 'r': return rMultiple ? `${rMultiple >= 0 ? '+' : ''}${rMultiple.toFixed(2)}R` : 'N/A'
      default: return `$${amount.toFixed(2)}`
    }
  }

  return (
    <span className={cn(
      "number-font font-semibold",
      isProfit ? "profit-text" : "loss-text",
      className
    )}>
      {getValue()}
    </span>
  )
}
```

### Trade Direction Badge
```typescript
export function TradeBadge({
  side,
  size = 'sm',
  className
}: {
  side: 'Long' | 'Short'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <span className={cn(
      "inline-flex items-center rounded-full font-medium",
      side === 'Long'
        ? "bg-green-500/10 text-green-500"
        : "bg-red-500/10 text-red-500",
      sizeClasses[size],
      className
    )}>
      {side}
    </span>
  )
}
```

### Symbol Display
```typescript
export function SymbolDisplay({
  symbol,
  showIcon = true,
  className
}: {
  symbol: string
  showIcon?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {showIcon && (
        <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">
            {symbol.slice(0, 2)}
          </span>
        </div>
      )}
      <span className="font-medium studio-text">{symbol}</span>
    </div>
  )
}
```

---

## 🔧 **Utility Components**

### Loading States
```typescript
// Spinner
<div className="flex items-center justify-center p-8">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
</div>

// Skeleton
<div className="space-y-3">
  <div className="skeleton h-4 w-full"></div>
  <div className="skeleton h-4 w-3/4"></div>
  <div className="skeleton h-4 w-1/2"></div>
</div>
```

### Empty States
```typescript
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: {
  icon: React.ComponentType<any>
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  className?: string
}) {
  return (
    <div className={cn("text-center p-12", className)}>
      <Icon className="h-12 w-12 studio-muted mx-auto mb-4" />
      <h3 className="text-lg font-semibold studio-text mb-2">{title}</h3>
      <p className="text-sm studio-muted mb-4 max-w-sm mx-auto">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      )}
    </div>
  )
}
```

### Error Boundary
```typescript
export function ErrorDisplay({
  error,
  onRetry,
  className
}: {
  error: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div className={cn("studio-surface rounded-lg p-6 border border-red-500/20", className)}>
      <div className="flex items-center space-x-3">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <div className="flex-1">
          <h4 className="font-medium studio-text">Error</h4>
          <p className="text-sm studio-muted">{error}</p>
        </div>
        {onRetry && (
          <button onClick={onRetry} className="btn-secondary">
            Retry
          </button>
        )}
      </div>
    </div>
  )
}
```

---

## 📱 **Responsive Patterns**

### Mobile-First Grid
```typescript
// Responsive metric grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
  {/* Cards automatically stack on mobile */}
</div>

// Responsive sidebar
<div className="flex flex-col lg:flex-row h-screen">
  <div className="lg:w-64 order-2 lg:order-1">
    {/* Sidebar - moves to bottom on mobile */}
  </div>
  <div className="flex-1 order-1 lg:order-2">
    {/* Main content */}
  </div>
</div>
```

### Mobile Navigation
```typescript
// Show full nav on desktop, minimal on mobile
<div className="hidden md:flex items-center space-x-1">
  {/* Desktop navigation */}
</div>
<div className="md:hidden">
  <button className="btn-ghost p-2">
    <Menu className="h-5 w-5" />
  </button>
</div>
```

---

## ⚡ **Performance Patterns**

### Lazy Loading
```typescript
import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))

// Usage
<Suspense fallback={<div className="skeleton h-64 w-full" />}>
  <HeavyComponent />
</Suspense>
```

### Memoized Components
```typescript
import { memo } from 'react'

export const MetricCard = memo(function MetricCard({
  title,
  value,
  type
}: MetricCardProps) {
  return (
    <div className="metric-tile">
      {/* Component content */}
    </div>
  )
})
```

---

## 🧪 **Testing Patterns**

### Component Testing Setup
```typescript
import { render, screen } from '@testing-library/react'
import { StudioTheme } from '@/components/providers/studio-theme'

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <StudioTheme>
      <DisplayModeProvider>
        {component}
      </DisplayModeProvider>
    </StudioTheme>
  )
}

// Usage
test('renders metric card', () => {
  renderWithProviders(<MetricCard title="Test" value="$100" />)
  expect(screen.getByText('Test')).toBeInTheDocument()
})
```

---

## 🎯 **AI Agent Quick Reference**

### Must-Have Imports for AI Agents
```typescript
// Always include these for Traderra components
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { /* icons */ } from 'lucide-react'

// Context hooks (use as needed)
import { useDisplayMode } from '@/contexts/DisplayModeContext'
import { usePnLMode } from '@/contexts/PnLModeContext'
import { useDateRange } from '@/contexts/DateRangeContext'
```

### Component Creation Checklist
- [ ] Uses `cn()` for className merging
- [ ] Applies appropriate studio theme classes
- [ ] Includes hover/focus states for interactive elements
- [ ] Uses `number-font` for financial data
- [ ] Implements proper TypeScript interfaces
- [ ] Includes loading and error states
- [ ] Responsive design considerations
- [ ] Accessibility attributes (aria-labels, etc.)

### Quick Component Template
```typescript
interface MyComponentProps {
  className?: string
  // Your props
}

export function MyComponent({ className, ...props }: MyComponentProps) {
  return (
    <div className={cn(
      "studio-surface rounded-lg p-6 shadow-studio",
      "hover:shadow-studio-lg transition-shadow",
      className
    )}>
      {/* Your content */}
    </div>
  )
}
```

---

This component library provides everything needed to build consistent, professional Traderra interfaces. Use these patterns as building blocks for any new Traderra platform or feature. 🚀