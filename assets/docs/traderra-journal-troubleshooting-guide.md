# Journal System Troubleshooting Guide

**Document Version**: 1.0
**Last Updated**: October 25, 2025
**System Scope**: React/Next.js Journal Applications
**Audience**: Frontend Developers, DevOps, QA Engineers
**Maintenance**: CE-Hub Technical Team

## Quick Reference

### Common Issues & Solutions

| Issue | Severity | Solution Reference |
|-------|----------|-------------------|
| Content not scrollable | Critical | [Flexbox Scrolling](#flexbox-scrolling-issues) |
| JavaScript function errors | Critical | [Module Scoping](#javascript-scoping-errors) |
| Layout height problems | Major | [Height Calculation](#height-calculation-issues) |
| Performance degradation | Major | [Performance Optimization](#performance-issues) |
| Content rendering errors | Minor | [Content Rendering](#content-rendering-issues) |

### Emergency Fixes

```bash
# Quick CSS fix for scrolling
.journal-container {
  height: 100vh !important;
  overflow-y: auto !important;
}

# JavaScript error bypass
export const markdownToHtml = (content) => content || '';
```

## Detailed Troubleshooting

### Flexbox Scrolling Issues

#### Symptoms
- Users cannot scroll through all entries
- Content appears cut off
- Only partial entries visible
- Fixed height containers not working

#### Diagnostic Steps

1. **Inspect Container Hierarchy**
   ```typescript
   // Check if proper flex structure exists
   <div className="flex flex-col h-full"> {/* Parent must have height */}
     <div className="flex-1 overflow-y-auto"> {/* Child must have overflow */}
   ```

2. **Verify Height Chain**
   ```bash
   # In browser DevTools, check computed styles
   # Parent containers should have explicit height
   html, body, #root, .app { height: 100% }
   ```

3. **Test Overflow Behavior**
   ```typescript
   // Add temporary debugging
   const checkOverflow = (element) => {
     console.log('scrollHeight:', element.scrollHeight);
     console.log('clientHeight:', element.clientHeight);
     console.log('Can scroll:', element.scrollHeight > element.clientHeight);
   };
   ```

#### Root Causes & Solutions

**Cause 1: Missing `min-h-0` on Flex Container**
```typescript
// ❌ WRONG - Flex items can overflow
<div className="flex flex-col h-full">
  <div className="flex-1 overflow-y-auto">

// ✅ CORRECT - Prevents flex item overflow
<div className="flex flex-col h-full min-h-0">
  <div className="flex-1 overflow-y-auto">
```

**Cause 2: Improper Flex Hierarchy**
```typescript
// ❌ WRONG - No flex context established
<div className="h-full">
  <div className="overflow-y-auto">

// ✅ CORRECT - Proper flex parent-child relationship
<div className="flex flex-col h-full">
  <div className="flex-1 overflow-y-auto">
```

**Cause 3: Fixed Header Not Prevented from Shrinking**
```typescript
// ❌ WRONG - Header can shrink, affecting scroll calculation
<div className="flex flex-col h-full">
  <div>Header</div> {/* Can shrink */
  <div className="flex-1 overflow-y-auto">Content</div>

// ✅ CORRECT - Header fixed size
<div className="flex flex-col h-full">
  <div className="shrink-0">Header</div> {/* Won't shrink */
  <div className="flex-1 overflow-y-auto">Content</div>
```

#### Testing & Validation

```typescript
// Automated test for scrolling functionality
describe('Scrolling Behavior', () => {
  test('container allows scrolling when content overflows', () => {
    const container = screen.getByTestId('journal-container');
    const { scrollHeight, clientHeight } = container;

    expect(scrollHeight).toBeGreaterThan(clientHeight);
    expect(container).toHaveStyle('overflow-y: auto');
  });
});
```

### JavaScript Scoping Errors

#### Symptoms
- "Function is not defined" errors
- Runtime crashes during content rendering
- Inconsistent function behavior
- Component re-render issues

#### Diagnostic Steps

1. **Check Function Definition Location**
   ```typescript
   // Is function defined inside component?
   const Component = () => {
     const myFunction = () => { /* Problem! */ };
   };
   ```

2. **Verify Import/Export Statements**
   ```typescript
   // Check if utility functions are properly exported
   export function markdownToHtml(content: string): string { }
   ```

3. **Test Function Scope**
   ```typescript
   // Add console logging to verify function availability
   console.log('Function available:', typeof markdownToHtml);
   ```

#### Root Causes & Solutions

**Cause 1: Function Defined in Component Scope**
```typescript
// ❌ WRONG - Function recreated on every render
const JournalEntry = () => {
  const markdownToHtml = (content) => { /* Processing */ };

  return <div dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />;
};

// ✅ CORRECT - Function in separate utility module
// File: /lib/markdown.ts
export function markdownToHtml(content: string): string { /* Processing */ }

// File: Component.tsx
import { markdownToHtml } from '@/lib/markdown';
```

**Cause 2: Incorrect Import Path**
```typescript
// ❌ WRONG - Incorrect import path
import { markdownToHtml } from './markdown'; // Wrong relative path

// ✅ CORRECT - Proper absolute import
import { markdownToHtml } from '@/lib/markdown';
```

**Cause 3: Missing Export Statement**
```typescript
// ❌ WRONG - Function not exported
function markdownToHtml(content: string): string { }

// ✅ CORRECT - Properly exported
export function markdownToHtml(content: string): string { }
```

#### Testing & Validation

```typescript
// Unit test for utility function
import { markdownToHtml } from '@/lib/markdown';

describe('Utility Functions', () => {
  test('markdownToHtml is available and functional', () => {
    expect(typeof markdownToHtml).toBe('function');
    expect(markdownToHtml('**bold**')).toContain('<strong>');
  });
});
```

### Height Calculation Issues

#### Symptoms
- Components don't fill available space
- Unexpected white space at bottom
- Content overflow in unexpected directions
- Mobile responsive issues

#### Diagnostic Steps

1. **Check Height Chain**
   ```css
   /* Verify height flows from root to component */
   html { height: 100%; }
   body { height: 100%; }
   #root { height: 100%; }
   .app { height: 100%; }
   ```

2. **Inspect CSS Box Model**
   ```javascript
   // Browser DevTools: Check computed styles
   const element = document.querySelector('.journal-container');
   console.log(getComputedStyle(element).height);
   ```

3. **Test Viewport Units**
   ```css
   /* Test with viewport units if percentage fails */
   .container { height: 100vh; }
   ```

#### Solutions

**Solution 1: Establish Height Context**
```typescript
// Ensure all parent containers have explicit height
<html style={{ height: '100%' }}>
  <body style={{ height: '100%' }}>
    <div id="root" style={{ height: '100%' }}>
      <div className="h-full">
        {/* Your component */}
      </div>
    </div>
  </body>
</html>
```

**Solution 2: Use Viewport Units for Top-Level**
```typescript
// For top-level containers, use viewport height
<div className="h-screen"> {/* h-screen = height: 100vh */}
  <div className="h-full">
    {/* Child components */}
  </div>
</div>
```

**Solution 3: Dynamic Height Calculation**
```typescript
const useDynamicHeight = () => {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      setHeight(window.innerHeight);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return height;
};
```

### Performance Issues

#### Symptoms
- Slow scrolling performance
- Frame drops during interaction
- High memory usage
- Laggy user interface

#### Diagnostic Steps

1. **Profile Rendering Performance**
   ```javascript
   // React DevTools Profiler
   // Check for unnecessary re-renders
   ```

2. **Monitor Memory Usage**
   ```javascript
   // Chrome DevTools Memory tab
   // Look for memory leaks
   ```

3. **Analyze Bundle Size**
   ```bash
   # Check bundle analyzer
   npm run build
   npx webpack-bundle-analyzer build/static/js/*.js
   ```

#### Solutions

**Solution 1: Implement Virtual Scrolling**
```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedJournal = ({ entries }) => (
  <List
    height={600}
    itemCount={entries.length}
    itemSize={120}
  >
    {({ index, style }) => (
      <div style={style}>
        <JournalEntry entry={entries[index]} />
      </div>
    )}
  </List>
);
```

**Solution 2: Optimize Re-renders**
```typescript
// Memoize expensive components
const JournalEntry = React.memo(({ entry }) => {
  return <div>{/* Entry content */}</div>;
});

// Use callback optimization
const handleEntryUpdate = useCallback((id, data) => {
  // Update logic
}, []);
```

**Solution 3: Implement Lazy Loading**
```typescript
const LazyJournalEntry = lazy(() => import('./JournalEntry'));

const JournalList = () => (
  <Suspense fallback={<div>Loading...</div>}>
    {entries.map(entry => (
      <LazyJournalEntry key={entry.id} entry={entry} />
    ))}
  </Suspense>
);
```

### Content Rendering Issues

#### Symptoms
- Markdown not rendering properly
- HTML entities not escaped
- XSS vulnerabilities
- Content formatting broken

#### Solutions

**Solution 1: Secure Markdown Processing**
```typescript
import DOMPurify from 'dompurify';

export function markdownToHtml(content: string): string {
  const html = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Sanitize HTML to prevent XSS
  return DOMPurify.sanitize(html);
}
```

**Solution 2: Error Boundary for Content**
```typescript
class ContentErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Content rendering error</div>;
    }

    return this.props.children;
  }
}
```

## Environment-Specific Issues

### Development Environment

**Issue**: Hot reload breaking component state
```typescript
// Solution: Preserve state during development
if (process.env.NODE_ENV === 'development') {
  if (module.hot) {
    module.hot.accept();
  }
}
```

### Production Environment

**Issue**: CSS classes not applying
```bash
# Check if Tailwind is properly built
npm run build
# Verify CSS file includes required classes
```

### Mobile Devices

**Issue**: Viewport height issues on mobile
```css
/* Use mobile-safe viewport units */
.mobile-container {
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height */
}
```

## Browser-Specific Issues

### Safari
```css
/* Safari flex bugs */
.safari-fix {
  -webkit-flex-shrink: 0;
  flex-shrink: 0;
}
```

### Internet Explorer (Legacy)
```css
/* IE11 flexbox fallbacks */
.ie-fallback {
  display: -ms-flexbox;
  -ms-flex-direction: column;
}
```

## Monitoring & Alerting

### Error Tracking Setup
```typescript
// Sentry integration for error monitoring
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_DSN',
  beforeSend(event) {
    // Filter journal-specific errors
    if (event.tags?.component === 'journal') {
      return event;
    }
  }
});
```

### Performance Monitoring
```typescript
// Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## Recovery Procedures

### Emergency Rollback
```bash
# Quick rollback to previous working version
git revert HEAD
npm run build
npm run deploy
```

### Data Recovery
```typescript
// Backup user data before fixes
const backupJournalData = () => {
  const data = localStorage.getItem('journalEntries');
  localStorage.setItem('journalBackup', data);
};
```

## Prevention Strategies

### Code Review Checklist
- [ ] Proper flexbox hierarchy implemented
- [ ] Utility functions in separate modules
- [ ] Height chain properly established
- [ ] Performance considerations addressed
- [ ] Error boundaries implemented

### Automated Testing
```typescript
// E2E test for critical functionality
test('journal system critical path', async ({ page }) => {
  await page.goto('/journal');

  // Test scrolling
  await page.locator('.journal-container').hover();
  await page.mouse.wheel(0, 500);

  // Test all entries accessible
  const lastEntry = page.locator('.journal-entry').last();
  await expect(lastEntry).toBeVisible();
});
```

## Escalation Procedures

### Level 1: Self-Service (Developer)
- Use this troubleshooting guide
- Check browser DevTools
- Review error logs

### Level 2: Team Lead (Team)
- Code review required
- Architecture decision needed
- Performance optimization required

### Level 3: Technical Architecture (Organization)
- Major architectural changes
- Cross-system compatibility issues
- Security vulnerabilities

### Level 4: Emergency Response (Critical)
- Production system down
- Data loss risk
- Security breach

---

**Maintained By**: CE-Hub Technical Documentation Team
**Emergency Contact**: [Team Lead Information]
**Last Updated**: October 25, 2025
**Review Schedule**: Monthly during active development