#!/usr/bin/env tsx
/**
 * Site Structure Scanner for AG-UI
 *
 * This script scans the Traderra codebase and generates a comprehensive
 * manifest of all pages, components, routes, and their relationships.
 * This manifest is then used by AG-UI to have complete site awareness.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, relative, dirname } from 'path'

interface SiteManifest {
  appName: string
  baseUrl: string
  generatedAt: string
  pages: PageManifest[]
  components: ComponentManifest[]
  routes: RouteManifest[]
}

interface PageManifest {
  path: string
  route: string
  title: string
  description: string
  components: string[]
  layouts: string[]
  apiRoutes?: string[]
}

interface ComponentManifest {
  name: string
  path: string
  category: string
  description: string
  props?: Record<string, { type: string; required: boolean; description: string }>
}

interface RouteManifest {
  path: string
  page: string
  params?: string[]
}

const PROJECT_ROOT = process.cwd()
const APP_DIR = join(PROJECT_ROOT, 'src', 'app')
const COMPONENTS_DIR = join(PROJECT_ROOT, 'src', 'components')

/**
 * Extract page title and description from page.tsx file content
 */
function extractPageInfo(content: string, filePath: string): { title: string; description: string } {
  const defaultTitle = filePath.split('/').pop()?.replace(/-/g, ' ') || 'Page'

  // Try to extract title from metadata or comments
  const titleMatch = content.match(/title:\s*['"`]([^'"`]+)['"`]/)
  const title = titleMatch ? titleMatch[1] : defaultTitle

  // Try to extract description from comments
  const descMatch = content.match(/\/\*\*\s*([\s\S]*?)\*\//)
  const description = descMatch
    ? descMatch[1].split('\n')[0].replace(/\*/g, '').trim()
    : `${title} page`

  return { title: title.charAt(0).toUpperCase() + title.slice(1), description }
}

/**
 * Extract component information from component file
 */
function extractComponentInfo(content: string, filePath: string): { name: string; description: string; category: string } {
  const fileName = filePath.split('/').pop() || 'component'
  const componentName = fileName.replace(/\.(tsx|ts|jsx|js)$/, '')

  // Extract description from docstring comment
  const descMatch = content.match(/\/\*\*\s*([\s\S]*?)\*\//)
  const description = descMatch
    ? descMatch[1].split('\n').slice(0, 3).join(' ').replace(/\*/g, '').trim()
    : `${componentName} component`

  // Determine category from folder structure
  const category = filePath.includes('/dashboard/')
    ? 'dashboard'
    : filePath.includes('/trades/')
      ? 'trades'
      : filePath.includes('/journal/')
        ? 'journal'
        : filePath.includes('/ui/')
          ? 'ui'
          : filePath.includes('/chat/')
            ? 'ai'
            : filePath.includes('/layout/')
              ? 'layout'
              : 'general'

  return { name: componentName, description, category }
}

/**
 * Get all files recursively in a directory
 */
function getFilesRecursively(dir: string, extension: string): string[] {
  const files: string[] = []

  if (!existsSync(dir)) return files

  const items = readdirSync(dir)

  for (const item of items) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      // Skip node_modules and other ignored dirs
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(item)) {
        files.push(...getFilesRecursively(fullPath, extension))
      }
    } else if (item.endsWith(extension)) {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Convert file path to route path
 */
function filePathToRoute(filePath: string): string {
  const relativePath = relative(APP_DIR, filePath)
  const routePath = relativePath
    .replace(/page\.tsx?$/, '')
    .replace(/\[\.{3}\w+\]/, '*') // Catch-all routes
    .replace(/\[(\w+)\]/g, ':$1') // Dynamic routes
    .replace(/\/$/, '') // Remove trailing slash

  return routePath === '' ? '/' : `/${routePath}`
}

/**
 * Scan all pages in the app directory
 */
function scanPages(): PageManifest[] {
  const pages: PageManifest[] = []
  const pageFiles = getFilesRecursively(APP_DIR, '.tsx')

  for (const filePath of pageFiles) {
    if (!filePath.includes('page.tsx')) continue

    const content = readFileSync(filePath, 'utf-8')
    const route = filePathToRoute(filePath)
    const { title, description } = extractPageInfo(content, filePath)

    // Extract components used in this page
    const componentImports = content.matchAll(/import\s+{([^}]+)}\s+from\s+['"`]@\/components\/([^'"`]+)['"`]/g)
    const components = Array.from(componentImports).map(([, , componentPath]) => componentPath)

    // Extract layout files
    const layoutMatch = filePath.replace('page.tsx', 'layout.tsx')
    const hasLayout = existsSync(layoutMatch)

    pages.push({
      path: relative(PROJECT_ROOT, filePath),
      route,
      title,
      description,
      components,
      layouts: hasLayout ? [relative(PROJECT_ROOT, layoutMatch)] : [],
    })
  }

  return pages.sort((a, b) => a.route.localeCompare(b.route))
}

/**
 * Scan all components in the components directory
 */
function scanComponents(): ComponentManifest[] {
  const components: ComponentManifest[] = []
  const componentFiles = getFilesRecursively(COMPONENTS_DIR, '.tsx')

  for (const filePath of componentFiles) {
    // Skip index files and test files
    if (filePath.includes('/index.ts') || filePath.includes('.test.') || filePath.includes('.spec.')) {
      continue
    }

    const content = readFileSync(filePath, 'utf-8')
    const { name, description, category } = extractComponentInfo(content, filePath)

    components.push({
      name,
      path: relative(PROJECT_ROOT, filePath),
      category,
      description,
    })
  }

  return components.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Generate route manifest
 */
function generateRoutes(pages: PageManifest[]): RouteManifest[] {
  return pages.map((page) => ({
    path: page.route,
    page: page.path,
    params: page.route.match(/:(\w+)/g)?.map((p) => p.replace(':', '')),
  }))
}

/**
 * Format pages for AG-UI system prompt
 */
function formatPagesForPrompt(pages: PageManifest[]): string {
  const sections: string[] = []

  // Group pages by category
  const pageCategories = {
    main: pages.filter((p) => p.route === '/' || p.route === '/dashboard'),
    trading: pages.filter((p) => p.route.includes('/trades') || p.route.includes('/journal')),
    analytics: pages.filter((p) => p.route.includes('/statistics') || p.route.includes('/analytics')),
    management: pages.filter((p) => p.route.includes('/settings') || p.route.includes('/calendar')),
    auth: pages.filter((p) => p.route.includes('/sign-') || p.route.includes('/auth')),
  }

  sections.push('\n## 📄 AVAILABLE PAGES\n')

  Object.entries(pageCategories).forEach(([category, categoryPages]) => {
    if (categoryPages.length === 0) return

    sections.push(`\n### ${category.toUpperCase()} PAGES\n`)
    categoryPages.forEach((page) => {
      sections.push(`- **${page.route}** - ${page.title}`)
      if (page.components.length > 0) {
        sections.push(`  - Components: ${page.components.slice(0, 5).join(', ')}${page.components.length > 5 ? '...' : ''}`)
      }
    })
  })

  return sections.join('\n')
}

/**
 * Format components for AG-UI system prompt
 */
function formatComponentsForPrompt(components: ComponentManifest[]): string {
  const sections: string[] = []

  sections.push('\n## 🧩 AVAILABLE COMPONENTS\n')

  // Group by category
  const byCategory: Record<string, ComponentManifest[]> = {}
  components.forEach((c) => {
    if (!byCategory[c.category]) byCategory[c.category] = []
    byCategory[c.category].push(c)
  })

  Object.entries(byCategory).forEach(([category, categoryComponents]) => {
    sections.push(`\n### ${category.toUpperCase()}\n`)
    categoryComponents.slice(0, 20).forEach((c) => {
      sections.push(`- **${c.name}**: ${c.description}`)
    })
    if (categoryComponents.length > 20) {
      sections.push(`  - ... and ${categoryComponents.length - 20} more`)
    }
  })

  return sections.join('\n')
}

/**
 * Main function to generate the site manifest
 */
function generateSiteManifest(): SiteManifest {
  console.log('🔍 Scanning Traderra site structure...')

  const pages = scanPages()
  console.log(`✅ Found ${pages.length} pages`)

  const components = scanComponents()
  console.log(`✅ Found ${components.length} components`)

  const routes = generateRoutes(pages)

  const manifest: SiteManifest = {
    appName: 'Traderra',
    baseUrl: 'http://localhost:6565',
    generatedAt: new Date().toISOString(),
    pages,
    components,
    routes,
  }

  return manifest
}

// Run the scanner
const manifest = generateSiteManifest()

// Write to JSON file
const manifestPath = join(PROJECT_ROOT, 'src', 'lib', 'ag-ui', 'site-manifest.json')
import { writeFileSync } from 'fs'
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
console.log(`✅ Site manifest written to: ${manifestPath}`)

// Also write the AG-UI prompt snippets
const promptPath = join(PROJECT_ROOT, 'src', 'lib', 'ag-ui', 'site-prompt.txt')
const promptContent = `# Traderra Site Knowledge for AG-UI

**Generated:** ${new Date().toISOString()}

${formatPagesForPrompt(manifest.pages)}

${formatComponentsForPrompt(manifest.components)}

## 🎯 NAVIGATION PATTERNS

- Use \`navigateToPage\` tool with route paths (e.g., "dashboard", "trades", "statistics")
- All navigation should go through the tool system, not direct URL manipulation
- Check page existence before attempting navigation

## 📊 PAGE-SPECIFIC FEATURES

### Dashboard (/)
- Main trading overview with metrics and charts
- Display mode toggles (dollar/R%/percentage)
- Date range selectors

### Trades (/trades)
- Complete trade list with filtering
- Trade detail modals
- Import/export functionality

### Journal (/journal)
- Trade journal entries
- Rich text editor for notes
- Template-based entries

### Statistics (/statistics)
- Performance analytics
- P&L calculations
- Win rate and risk metrics

### Calendar (/calendar)
- Trading calendar view
- Daily summary cards
- Date-based filtering

### Settings (/settings)
- User preferences
- Account configuration
- Theme options

`

writeFileSync(promptPath, promptContent, 'utf-8')
console.log(`✅ Site prompt written to: ${promptPath}`)

console.log('\n🎉 Site scan complete!')
console.log(`   - ${manifest.pages.length} pages discovered`)
console.log(`   - ${manifest.components.length} components discovered`)
console.log(`   - ${manifest.routes.length} routes mapped`)
