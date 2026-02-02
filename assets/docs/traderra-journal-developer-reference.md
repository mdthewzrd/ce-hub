# Journal System Developer Reference

**Document Version**: 1.0
**Last Updated**: October 25, 2025
**System**: Traderra Journal System
**Audience**: Frontend Developers, New Team Members
**Repository**: CE-Hub/Traderra Frontend

## Quick Start

### Repository Structure
```
traderra/frontend/
├── src/
│   ├── app/journal/
│   │   └── page.tsx              # Main journal page component
│   ├── components/journal/
│   │   ├── JournalLayout.tsx     # Layout wrapper component
│   │   ├── EntryCard.tsx         # Individual entry display
│   │   └── EntryModal.tsx        # Entry creation/editing modal
│   └── lib/
│       └── markdown.ts           # Markdown processing utilities
```

### Core Dependencies
```json
{
  "react": "^18.0.0",
  "next": "^14.0.0",
  "tailwindcss": "^3.0.0",
  "typescript": "^5.0.0"
}
```

### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## API Reference

### Components

#### JournalPage
Main page component for the journal system.

**File**: `/src/app/journal/page.tsx`

```typescript
export default function JournalPage(): JSX.Element
```

**Props**: None (uses internal state and data fetching)

**Features**:
- Entry listing with scrollable container
- Entry creation and editing
- Search and filtering capabilities
- Responsive layout

**Usage**:
```typescript
// Accessed via Next.js App Router
// URL: /journal
```

#### JournalLayout
Layout wrapper providing consistent structure.

**File**: `/src/components/journal/JournalLayout.tsx`

```typescript
interface JournalLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export function JournalLayout(props: JournalLayoutProps): JSX.Element
```

**Props**:
- `children`: Main content area
- `sidebar` (optional): Sidebar content

**Usage**:
```typescript
<JournalLayout sidebar={<NavigationSidebar />}>
  <JournalEntries />
</JournalLayout>
```

#### EntryCard
Displays individual journal entries.

**File**: `/src/components/journal/EntryCard.tsx`

```typescript
interface EntryCardProps {
  entry: JournalEntry;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function EntryCard(props: EntryCardProps): JSX.Element
```

**Props**:
- `entry`: Journal entry data object
- `onEdit` (optional): Edit callback function
- `onDelete` (optional): Delete callback function
- `className` (optional): Additional CSS classes

**Usage**:
```typescript
<EntryCard
  entry={entryData}
  onEdit={handleEdit}
  onDelete={handleDelete}
  className="mb-4"
/>
```

### Types

#### JournalEntry
Core data structure for journal entries.

```typescript
interface JournalEntry {
  id: string;
  title: string;
  content: string;
  type: 'daily_review' | 'trade_analysis' | 'strategy_notes' | 'general';
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  metadata: {
    word_count: number;
    read_time: number;
    [key: string]: any;
  };
}
```

#### EntryFilter
Filter configuration for entry display.

```typescript
interface EntryFilter {
  type?: string;
  category?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  searchQuery?: string;
}
```

### Utilities

#### markdownToHtml
Converts markdown content to HTML for rendering.

**File**: `/src/lib/markdown.ts`

```typescript
export function markdownToHtml(content: string): string
```

**Parameters**:
- `content`: Raw markdown string

**Returns**: HTML string ready for `dangerouslySetInnerHTML`

**Example**:
```typescript
import { markdownToHtml } from '@/lib/markdown';

const htmlContent = markdownToHtml('**Bold** and *italic* text');
// Returns: '<p><strong>Bold</strong> and <em>italic</em> text</p>'
```

**Supported Markdown**:
- `**bold**` → `<strong>bold</strong>`
- `*italic*` → `<em>italic</em>`
- Line breaks → `<br>`
- Paragraph breaks → `<p>` tags

### Hooks

#### useJournalEntries
Manages journal entry state and operations.

```typescript
interface UseJournalEntriesReturn {
  entries: JournalEntry[];
  loading: boolean;
  error: string | null;
  createEntry: (data: CreateEntryData) => Promise<void>;
  updateEntry: (id: string, data: UpdateEntryData) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  filterEntries: (filter: EntryFilter) => void;
  searchEntries: (query: string) => void;
}

export function useJournalEntries(): UseJournalEntriesReturn
```

**Usage**:
```typescript
const {
  entries,
  loading,
  createEntry,
  updateEntry,
  deleteEntry
} = useJournalEntries();
```

#### useEntryFilter
Manages entry filtering and search functionality.

```typescript
interface UseEntryFilterReturn {
  filter: EntryFilter;
  setFilter: (filter: Partial<EntryFilter>) => void;
  clearFilter: () => void;
  filteredEntries: JournalEntry[];
}

export function useEntryFilter(entries: JournalEntry[]): UseEntryFilterReturn
```

## Styling Guidelines

### CSS Architecture

#### Layout Classes
```css
/* Container Structure */
.journal-container {
  @apply flex flex-col h-full min-h-0;
}

/* Fixed Header */
.journal-header {
  @apply shrink-0 border-b border-gray-200 bg-white;
}

/* Scrollable Content */
.journal-content {
  @apply flex-1 overflow-y-auto px-6 pb-6;
}
```

#### Component-Specific Styles
```css
/* Entry Cards */
.entry-card {
  @apply bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow;
}

/* Entry Actions */
.entry-actions {
  @apply flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity;
}
```

### Responsive Design

#### Breakpoint Usage
```typescript
// Tailwind breakpoints
const breakpoints = {
  sm: '640px',   // Small tablets
  md: '768px',   // Large tablets
  lg: '1024px',  // Laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px' // Large desktops
};
```

#### Mobile-First Approach
```typescript
<div className="
  grid grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
  gap-4
">
  {/* Entry cards */}
</div>
```

## State Management

### Component State Pattern

```typescript
const JournalPage = () => {
  // Local state for UI
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<EntryFilter>({});

  // Data operations
  const { entries, loading, createEntry, updateEntry } = useJournalEntries();

  // Computed values
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => matchesFilter(entry, filter));
  }, [entries, filter]);

  return (
    // Component JSX
  );
};
```

### Data Flow Pattern

```
User Action → Component Handler → Hook Operation → State Update → UI Re-render
     ↓              ↓                    ↓              ↓            ↓
  Button Click → handleCreate → createEntry → setEntries → New Entry Displayed
```

## Performance Guidelines

### Optimization Strategies

#### 1. Component Memoization
```typescript
// Memoize expensive components
const EntryCard = React.memo(({ entry, onEdit, onDelete }) => {
  return (
    <div className="entry-card">
      {/* Entry content */}
    </div>
  );
});

// Memoize callback functions
const handleEntryUpdate = useCallback((id: string, data: UpdateEntryData) => {
  updateEntry(id, data);
}, [updateEntry]);
```

#### 2. Virtual Scrolling (for large lists)
```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedEntryList = ({ entries }) => (
  <List
    height={600}
    itemCount={entries.length}
    itemSize={120}
    overscanCount={5}
  >
    {({ index, style }) => (
      <div style={style}>
        <EntryCard entry={entries[index]} />
      </div>
    )}
  </List>
);
```

#### 3. Debounced Search
```typescript
const useDebounceSearch = (callback: (query: string) => void, delay = 300) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      callback(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, callback, delay]);

  return [query, setQuery] as const;
};
```

### Bundle Optimization

#### Code Splitting
```typescript
// Lazy load heavy components
const EntryEditor = lazy(() => import('./EntryEditor'));
const EntryAnalytics = lazy(() => import('./EntryAnalytics'));

// Use in component
<Suspense fallback={<LoadingSpinner />}>
  <EntryEditor />
</Suspense>
```

#### Tree Shaking
```typescript
// Import only what you need
import { format } from 'date-fns';
// Instead of: import * as dateFns from 'date-fns';

// Use ES modules for utilities
export { markdownToHtml } from './markdown';
// Instead of: module.exports = { markdownToHtml };
```

## Testing Standards

### Component Testing

#### Basic Component Test
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { EntryCard } from '@/components/journal/EntryCard';

describe('EntryCard', () => {
  const mockEntry: JournalEntry = {
    id: '1',
    title: 'Test Entry',
    content: 'Test content',
    type: 'daily_review',
    // ... other required fields
  };

  test('renders entry content', () => {
    render(<EntryCard entry={mockEntry} />);

    expect(screen.getByText('Test Entry')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('calls onEdit when edit button clicked', () => {
    const onEdit = jest.fn();
    render(<EntryCard entry={mockEntry} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith('1');
  });
});
```

#### Hook Testing
```typescript
import { renderHook, act } from '@testing-library/react';
import { useJournalEntries } from '@/hooks/useJournalEntries';

describe('useJournalEntries', () => {
  test('creates entry successfully', async () => {
    const { result } = renderHook(() => useJournalEntries());

    await act(async () => {
      await result.current.createEntry({
        title: 'New Entry',
        content: 'Content',
        type: 'daily_review'
      });
    });

    expect(result.current.entries).toHaveLength(1);
  });
});
```

### Integration Testing

#### E2E Testing with Playwright
```typescript
import { test, expect } from '@playwright/test';

test('journal entry creation flow', async ({ page }) => {
  await page.goto('/journal');

  // Open create modal
  await page.click('[data-testid="create-entry-button"]');

  // Fill form
  await page.fill('[data-testid="entry-title"]', 'Test Entry');
  await page.fill('[data-testid="entry-content"]', 'Test content');

  // Submit
  await page.click('[data-testid="save-entry-button"]');

  // Verify entry appears
  await expect(page.locator('[data-testid="journal-entry"]')).toContainText('Test Entry');
});
```

## Security Guidelines

### Content Sanitization

```typescript
import DOMPurify from 'dompurify';

// Always sanitize user-generated content
export function markdownToHtml(content: string): string {
  const html = processMarkdown(content);
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'br'],
    ALLOWED_ATTR: []
  });
}
```

### XSS Prevention

```typescript
// Use dangerouslySetInnerHTML safely
<div
  dangerouslySetInnerHTML={{
    __html: markdownToHtml(entry.content) // Pre-sanitized
  }}
/>

// Prefer text content when possible
<div>{entry.title}</div> // Automatically escaped
```

## Accessibility Guidelines

### Semantic HTML

```typescript
// Use proper heading hierarchy
<main>
  <h1>Journal</h1>
  <section>
    <h2>Recent Entries</h2>
    <article>
      <h3>{entry.title}</h3>
      <p>{entry.content}</p>
    </article>
  </section>
</main>
```

### ARIA Attributes

```typescript
// Accessible modal
<div
  role="dialog"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
  aria-modal="true"
>
  <h2 id="modal-title">Create Entry</h2>
  <p id="modal-description">Fill out the form to create a new journal entry</p>
</div>
```

### Keyboard Navigation

```typescript
// Focus management
const Modal = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      // ...
    />
  );
};
```

## Deployment Guidelines

### Build Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Production optimizations
  swcMinify: true,
  compress: true,
};

module.exports = nextConfig;
```

### Environment Variables

```bash
# .env.local (development)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_ENV=development

# .env.production (production)
NEXT_PUBLIC_API_URL=https://api.traderra.com
NEXT_PUBLIC_APP_ENV=production
```

### Production Checklist

- [ ] All tests passing
- [ ] Bundle size optimized
- [ ] Performance benchmarks met
- [ ] Accessibility validated
- [ ] Security review completed
- [ ] Error monitoring configured
- [ ] Analytics tracking implemented

## Troubleshooting

### Common Issues

#### Scrolling Problems
```typescript
// Ensure proper flex hierarchy
<div className="flex flex-col h-full min-h-0">
  <div className="shrink-0">Header</div>
  <div className="flex-1 overflow-y-auto">Content</div>
</div>
```

#### Function Scope Errors
```typescript
// Move utilities to separate modules
// File: /lib/utils.ts
export function myUtility() { }

// File: component.tsx
import { myUtility } from '@/lib/utils';
```

### Debug Tools

#### React DevTools
```typescript
// Add display names for debugging
EntryCard.displayName = 'EntryCard';
JournalLayout.displayName = 'JournalLayout';
```

#### Performance Profiling
```typescript
// Add performance markers
performance.mark('journal-render-start');
// ... component render
performance.mark('journal-render-end');
performance.measure('journal-render', 'journal-render-start', 'journal-render-end');
```

## Contributing Guidelines

### Code Style

```typescript
// Use TypeScript for all new code
interface ComponentProps {
  required: string;
  optional?: number;
}

// Follow naming conventions
const ComponentName = () => { }; // PascalCase for components
const variableName = ''; // camelCase for variables
const CONSTANT_NAME = ''; // UPPER_SNAKE_CASE for constants
```

### Git Workflow

```bash
# Feature branch naming
git checkout -b feature/journal-entry-editing
git checkout -b fix/scrolling-performance
git checkout -b docs/api-reference

# Commit message format
git commit -m "feat(journal): add entry editing functionality"
git commit -m "fix(journal): resolve scrolling performance issue"
git commit -m "docs(journal): update API reference"
```

### Code Review Checklist

- [ ] TypeScript types properly defined
- [ ] Components properly memoized
- [ ] Accessibility attributes included
- [ ] Tests written and passing
- [ ] Performance considerations addressed
- [ ] Documentation updated

---

**Maintained By**: CE-Hub Frontend Team
**Next Review**: Quarterly
**Version Control**: Git-managed, semantic versioning
**Support Channel**: #frontend-development