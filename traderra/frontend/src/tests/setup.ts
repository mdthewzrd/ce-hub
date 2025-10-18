/**
 * Test Setup Configuration
 *
 * Global test setup for Vitest including DOM environment,
 * mock configurations, and testing utilities.
 */

import { expect, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Global cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.clearAllTimers()
})

// Global setup before all tests
beforeAll(() => {
  // Mock window.matchMedia for responsive design tests
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock ResizeObserver for responsive components
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock IntersectionObserver for virtual scrolling
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock scrollTo for smooth scrolling tests
  window.scrollTo = vi.fn()
  Element.prototype.scrollTo = vi.fn()

  // Mock getComputedStyle for layout tests
  window.getComputedStyle = vi.fn().mockReturnValue({
    getPropertyValue: vi.fn().mockReturnValue(''),
    display: 'block',
    position: 'static',
    width: '100px',
    height: '100px'
  })

  // Mock fetch for API testing
  global.fetch = vi.fn()

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  }
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  })

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock
  })

  // Mock URL for link testing
  global.URL.createObjectURL = vi.fn()
  global.URL.revokeObjectURL = vi.fn()

  // Mock performance API
  Object.defineProperty(window, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn(() => []),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn()
    }
  })

  // Mock console methods for cleaner test output
  global.console = {
    ...console,
    // Uncomment to silence console during tests
    // log: vi.fn(),
    // warn: vi.fn(),
    // error: vi.fn(),
  }
})

// Global cleanup after all tests
afterAll(() => {
  vi.restoreAllMocks()
})

// Custom test utilities
export const createMockEntry = (overrides = {}) => ({
  id: '1',
  date: '2024-01-29',
  title: 'Test Entry',
  symbol: 'TEST',
  side: 'Long' as const,
  entryPrice: 100,
  exitPrice: 110,
  pnl: 1000,
  rating: 5,
  tags: ['test'],
  content: 'Test content',
  emotion: 'confident',
  category: 'win' as const,
  createdAt: '2024-01-29T16:45:00Z',
  ...overrides
})

export const createMockFolder = (overrides = {}) => ({
  id: '1',
  name: 'Test Folder',
  icon: 'folder',
  color: '#FFD700',
  position: 0,
  children: [],
  contentCount: 0,
  ...overrides
})

export const createMockApiResponse = <T>(data: T, overrides = {}) => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  json: async () => data,
  text: async () => JSON.stringify(data),
  ...overrides
})

// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<void> | void) => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

// Accessibility testing utilities
export const checkAccessibility = async (container: HTMLElement) => {
  // This would integrate with axe-core in a real implementation
  // For now, we'll check basic accessibility requirements
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )

  return {
    focusableElements: focusableElements.length,
    hasHeadings: container.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0,
    hasLabels: container.querySelectorAll('label').length > 0,
    hasAriaLabels: container.querySelectorAll('[aria-label]').length > 0
  }
}

// Mock API responses for testing
export const mockApiResponses = {
  folderTree: {
    folders: [
      {
        id: '1',
        name: 'Trading Journal',
        icon: 'journal-text',
        color: '#FFD700',
        position: 0,
        children: [
          {
            id: '2',
            name: 'Trade Entries',
            parent_id: '1',
            icon: 'trending-up',
            color: '#10B981',
            position: 1,
            children: [],
            content_count: 4,
            user_id: 'test-user',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ],
        content_count: 4,
        user_id: 'test-user',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ],
    total_folders: 2,
    total_content_items: 4
  },

  contentItems: {
    items: [
      {
        id: 'content-1',
        folder_id: '2',
        type: 'trade_entry' as const,
        title: 'Test Trade Entry',
        content: {
          trade_data: {
            symbol: 'TEST',
            side: 'Long',
            entry_price: 100,
            exit_price: 110,
            pnl: 1000
          }
        },
        metadata: {},
        tags: ['test'],
        user_id: 'test-user',
        folder_name: 'Trade Entries',
        folder_icon: 'trending-up',
        folder_color: '#10B981',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ],
    total: 1,
    limit: 50,
    offset: 0,
    has_more: false
  }
}

// Test environment detection
export const isTestEnvironment = () => process.env.NODE_ENV === 'test'

// Async utilities for testing
export const waitFor = (condition: () => boolean, timeout = 5000) => {
  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now()
    const check = () => {
      if (condition()) {
        resolve()
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`))
      } else {
        setTimeout(check, 10)
      }
    }
    check()
  })
}

// Network simulation utilities
export const simulateNetworkDelay = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const simulateNetworkError = () => {
  throw new Error('Network error')
}

// Component testing utilities
export const createTestProps = (overrides = {}) => ({
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onSave: vi.fn(),
  onClose: vi.fn(),
  onFolderSelect: vi.fn(),
  onFolderExpand: vi.fn(),
  onFolderCreate: vi.fn(),
  onFiltersChange: vi.fn(),
  ...overrides
})

// React Query test utilities
export const createTestQueryClient = () => {
  const { QueryClient } = require('@tanstack/react-query')
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

// Type definitions for test utilities
declare global {
  interface Window {
    matchMedia: any
  }
}

// Export commonly used testing library utilities
export * from '@testing-library/react'
export * from '@testing-library/user-event'
export { vi, expect } from 'vitest'